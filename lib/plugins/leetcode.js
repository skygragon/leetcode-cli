'use strict';
var util = require('util');

var _ = require('underscore');
var request = require('request');
var prompt = require('prompt');

var config = require('../config');
var h = require('../helper');
var file = require('../file');
var log = require('../log');
var Plugin = require('../plugin');
var Queue = require('../queue');
var session = require('../session');

const plugin = new Plugin(10, 'leetcode', '',
    'Plugin to talk with leetcode APIs.');

var spin;

// update options with user credentials
plugin.signOpts = function(opts, user) {
  opts.headers.Cookie = 'LEETCODE_SESSION=' + user.sessionId +
                        ';csrftoken=' + user.sessionCSRF + ';';
  opts.headers['X-CSRFToken'] = user.sessionCSRF;
  opts.headers['X-Requested-With'] = 'XMLHttpRequest';
};

plugin.makeOpts = function(url) {
  const opts = {};
  opts.url = url;
  opts.headers = {};

  if (session.isLogin())
    plugin.signOpts(opts, session.getUser());
  return opts;
};

plugin.checkError = function(e, resp, expectedStatus) {
  if (!e && resp && resp.statusCode !== expectedStatus) {
    const code = resp.statusCode;
    log.debug('http error: ' + code);

    if (code === 403 || code === 401) {
      e = session.errors.EXPIRED;
    } else {
      e = {msg: 'http error', statusCode: code};
    }
  }
  return e;
};

plugin.init = function() {
  config.app = 'leetcode';
};

plugin.getProblems = function (needTranslation, cb) {
  log.debug('running leetcode.getProblems');
  let problems = [];
  const getCategory = function(category, queue, cb) {
    plugin.getCategoryProblems(category, function(e, _problems) {
      if (e) {
        log.debug(category + ': failed to getProblems: ' + e.msg);
      } else {
        log.debug(category + ': getProblems got ' + _problems.length + ' problems');
        problems = problems.concat(_problems);
      }
      return cb(e);
    });
  };

  spin = h.spin('Downloading problems');
  const q = new Queue(config.sys.categories, {}, getCategory);
  q.run(null, function(e) {
    spin.stop();
    return cb(e, problems);
  });
};

plugin.getCategoryProblems = function(category, cb) {
  log.debug('running leetcode.getCategoryProblems: ' + category);
  const opts = plugin.makeOpts(config.sys.urls.problems.replace('$category', category));

  spin.text = 'Downloading category ' + category;
  request(opts, function(e, resp, body) {
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    const json = JSON.parse(body);

    // leetcode permits anonymous access to the problem list
    // while we require login first to make a better experience.
    if (json.user_name.length === 0) {
      log.debug('no user info in list response, maybe session expired...');
      return cb(session.errors.EXPIRED);
    }

    const problems = json.stat_status_pairs
        .filter((p) => !p.stat.question__hide)
        .map(function(p) {
          return {
            state:    p.status || 'None',
            id:       p.stat.question_id,
            fid:      p.stat.frontend_question_id,
            name:     p.stat.question__title,
            slug:     p.stat.question__title_slug,
            link:     config.sys.urls.problem.replace('$slug', p.stat.question__title_slug),
            locked:   p.paid_only,
            percent:  p.stat.total_acs * 100 / p.stat.total_submitted,
            level:    h.levelToName(p.difficulty.level),
            starred:  p.is_favor,
            category: json.category_slug
          };
        });

    return cb(null, problems);
  });
};

plugin.getProblem = function(problem, needTranslation, cb) {
  log.debug('running leetcode.getProblem');
  const user = session.getUser();
  if (problem.locked && !user.paid) return cb('failed to load locked problem!');

  const opts = plugin.makeOpts(config.sys.urls.graphql);
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = problem.link;

  opts.json = true;
  opts.body = {
    query: [
      'query getQuestionDetail($titleSlug: String!) {',
      '  question(titleSlug: $titleSlug) {',
      '    content',
      '    stats',
      '    likes',
      '    dislikes',
      '    codeDefinition',
      '    sampleTestCase',
      '    enableRunCode',
      '    metaData',
      '    translatedContent',
      '  }',
      '}'
    ].join('\n'),
    variables:     {titleSlug: problem.slug},
    operationName: 'getQuestionDetail'
  };

  const spin = h.spin('Downloading ' + problem.slug);
  request.post(opts, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    const q = body.data.question;
    if (!q) return cb('failed to load problem!');

    problem.totalAC = JSON.parse(q.stats).totalAccepted;
    problem.totalSubmit = JSON.parse(q.stats).totalSubmission;
    problem.likes = q.likes;
    problem.dislikes = q.dislikes;

    problem.desc = (q.translatedContent && needTranslation) ? q.translatedContent : q.content;

    problem.templates = JSON.parse(q.codeDefinition);
    problem.testcase = q.sampleTestCase;
    problem.testable = q.enableRunCode;
    problem.templateMeta = JSON.parse(q.metaData);
    // @si-yao: seems below property is never used.
    // problem.discuss =  q.discussCategoryId;

    return cb(null, problem);
  });
};

function runCode(opts, problem, cb) {
  opts.method = 'POST';
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = problem.link;
  opts.json = true;
  opts._delay = opts._delay || config.network.delay || 1; // in seconds

  opts.body = opts.body || {};
  _.extendOwn(opts.body, {
    lang:        problem.lang,
    question_id: parseInt(problem.id, 10),
    test_mode:   false,
    typed_code:  file.codeData(problem.file)
  });

  const spin = h.spin('Sending code to judge');
  request(opts, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    if (body.error) {
      if (!body.error.includes('too soon'))
        return cb(body.error);

      // hit 'run code too soon' error, have to wait a bit
      log.debug(body.error);

      // linear wait
      ++opts._delay;
      log.debug('Will retry after %d seconds...', opts._delay);

      const reRun = _.partial(runCode, opts, problem, cb);
      return setTimeout(reRun, opts._delay * 1000);
    }

    opts.json = false;
    opts.body = null;

    return cb(null, body);
  });
}

function verifyResult(task, queue, cb) {
  const opts = queue.ctx.opts;
  opts.method = 'GET';
  opts.url = config.sys.urls.verify.replace('$id', task.id);

  const spin = h.spin('Waiting for judge result');
  request(opts, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    let result = JSON.parse(body);
    if (result.state === 'SUCCESS') {
      result = formatResult(result);
      _.extendOwn(result, task);
      queue.ctx.results.push(result);
    } else {
      queue.addTask(task);
    }
    return cb();
  });
}

function formatResult(result) {
  const x = {
    ok:                 result.run_success,
    lang:               result.lang,
    runtime:            result.status_runtime || '',
    runtime_percentile: result.runtime_percentile || '',
    memory:             result.status_memory || '',
    memory_percentile:  result.memory_percentile || '',
    state:              result.status_msg,
    testcase:           util.inspect(result.input || result.last_testcase || ''),
    passed:             result.total_correct || 0,
    total:              result.total_testcases || 0
  };

  x.error = _.chain(result)
      .pick((v, k) => /_error$/.test(k) && v.length > 0)
      .values()
      .value();

  if (/[runcode|interpret].*/.test(result.submission_id)) {
    // It's testing
    let output = result.code_output || [];
    if (Array.isArray(output)) {
      output = output.join('\n');
    }
    x.stdout = util.inspect(output);
    x.answer = result.code_answer;
    // LeetCode use 'expected_code_answer' to store the expected answer
    x.expected_answer = result.expected_code_answer;
  } else {
    // It's submitting
    x.answer = result.code_output;
    x.expected_answer = result.expected_output;
    x.stdout = result.std_output;
  }

  // make sure we pass eveything!
  if (x.passed !== x.total) x.ok = false;
  if (x.state !== 'Accepted') x.ok = false;
  if (x.error.length > 0) x.ok = false;

  return x;
}

plugin.testProblem = function(problem, cb) {
  log.debug('running leetcode.testProblem');
  const opts = plugin.makeOpts(config.sys.urls.test.replace('$slug', problem.slug));
  opts.body = {data_input: problem.testcase};

  runCode(opts, problem, function(e, task) {
    if (e) return cb(e);

    const tasks = [
      {type: 'Actual', id: task.interpret_id},
    ];

    // Used by LeetCode-CN
    if (task.interpret_expected_id) {
      tasks.push({type: 'Expected', id: task.interpret_expected_id});
    }
    const q = new Queue(tasks, {opts: opts, results: []}, verifyResult);
    q.run(null, function(e, ctx) {
      return cb(e, ctx.results);
    });
  });
};

plugin.submitProblem = function(problem, cb) {
  log.debug('running leetcode.submitProblem');
  const opts = plugin.makeOpts(config.sys.urls.submit.replace('$slug', problem.slug));
  opts.body = {judge_type: 'large'};

  runCode(opts, problem, function(e, task) {
    if (e) return cb(e);

    const tasks = [{type: 'Actual', id: task.submission_id}];
    const q = new Queue(tasks, {opts: opts, results: []}, verifyResult);
    q.run(null, function(e, ctx) {
      return cb(e, ctx.results);
    });
  });
};

plugin.getSubmissions = function(problem, cb) {
  log.debug('running leetcode.getSubmissions');
  const opts = plugin.makeOpts(config.sys.urls.submissions.replace('$slug', problem.slug));
  opts.headers.Referer = config.sys.urls.problem.replace('$slug', problem.slug);

  request(opts, function(e, resp, body) {
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    // FIXME: this only return the 1st 20 submissions, we should get next if necessary.
    const submissions = JSON.parse(body).submissions_dump;
    for (const submission of submissions)
      submission.id = _.last(_.compact(submission.url.split('/')));

    return cb(null, submissions);
  });
};

plugin.getSubmission = function(submission, cb) {
  log.debug('running leetcode.getSubmission');
  const opts = plugin.makeOpts(config.sys.urls.submission.replace('$id', submission.id));

  request(opts, function(e, resp, body) {
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    let re = body.match(/submissionCode:\s('[^']*')/);
    if (re) submission.code = eval(re[1]);

    re = body.match(/runtimeDistributionFormatted:\s('[^']+')/);
    if (re) submission.distributionChart = JSON.parse(eval(re[1]));
    return cb(null, submission);
  });
};

plugin.starProblem = function(problem, starred, cb) {
  log.debug('running leetcode.starProblem');
  const user = session.getUser();
  const operationName = starred ? 'addQuestionToFavorite' : 'removeQuestionFromFavorite';
  const opts = plugin.makeOpts(config.sys.urls.graphql);
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = problem.link;

  opts.json = true;
  opts.body = {
    query:         `mutation ${operationName}($favoriteIdHash: String!, $questionId: String!) {\n  ${operationName}(favoriteIdHash: $favoriteIdHash, questionId: $questionId) {\n    ok\n    error\n    favoriteIdHash\n    questionId\n    __typename\n  }\n}\n`,
    variables:     {favoriteIdHash: user.hash, questionId: '' + problem.id},
    operationName: operationName
  };

  const spin = h.spin(starred? 'star': 'unstar' + 'problem');
  request.post(opts, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);
    return cb(null, starred);
  });
};

plugin.getFavorites = function(cb) {
  log.debug('running leetcode.getFavorites');
  const opts = plugin.makeOpts(config.sys.urls.favorites);

  const spin = h.spin('Retrieving user favorites');
  request(opts, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    const favorites = JSON.parse(body);
    return cb(null, favorites);
  });
};

plugin.getUserInfo = function(cb) {
  log.debug('running leetcode.getUserInfo');
  const opts = plugin.makeOpts(config.sys.urls.graphql);
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = config.sys.urls.base;
  opts.json = true;
  opts.body = {
    query: [
      '{',
      '  user {',
      '    username',
      '    isCurrentUserPremium',
      '  }',
      '}'
    ].join('\n'),
    variables: {}
  };

  const spin = h.spin('Retrieving user profile');
  request.post(opts, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    const user = body.data.user;
    return cb(null, user);
  });
};

function runSession(method, data, cb) {
  const opts = plugin.makeOpts(config.sys.urls.session);
  opts.json = true;
  opts.method = method;
  opts.body = data;

  const spin = h.spin('Waiting session result');
  request(opts, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e && e.statusCode === 302) e = session.errors.EXPIRED;

    return e ? cb(e) : cb(null, body.sessions);
  });
}

plugin.getSessions = function(cb) {
  log.debug('running leetcode.getSessions');
  runSession('POST', {}, cb);
};

plugin.activateSession = function(session, cb) {
  log.debug('running leetcode.activateSession');
  const data = {func: 'activate', target: session.id};
  runSession('PUT', data, cb);
};

plugin.createSession = function(name, cb) {
  log.debug('running leetcode.createSession');
  const data = {func: 'create', name: name};
  runSession('PUT', data, cb);
};

plugin.deleteSession = function(session, cb) {
  log.debug('running leetcode.deleteSession');
  const data = {target: session.id};
  runSession('DELETE', data, cb);
};

plugin.signin = function(user, cb) {
  const isCN = config.app === 'leetcode.cn';
  const spin = isCN ? h.spin('Signing in leetcode.cn') : h.spin('Signing in leetcode.com');
  request(config.sys.urls.login, function(e, resp, body) {
    spin.stop();
    e = plugin.checkError(e, resp, 200);
    if (e) return cb(e);

    user.loginCSRF = h.getSetCookieValue(resp, 'csrftoken');

    const opts = {
      url:     config.sys.urls.login,
      headers: {
        Origin:  config.sys.urls.base,
        Referer: config.sys.urls.login,
        Cookie:  'csrftoken=' + user.loginCSRF + ';'
      },
      form: {
        csrfmiddlewaretoken: user.loginCSRF,
        login:               user.login,
        password:            user.pass
      }
    };
    request.post(opts, function(e, resp, body) {
      if (e) return cb(e);
      if (resp.statusCode !== 302) return cb('invalid password?');

      user.sessionCSRF = h.getSetCookieValue(resp, 'csrftoken');
      user.sessionId = h.getSetCookieValue(resp, 'LEETCODE_SESSION');
      session.saveUser(user);
      return cb(null, user);
    });
  });
};

plugin.getUser = function(user, cb) {
  plugin.getFavorites(function(e, favorites) {
    if (!e) {
      const f = favorites.favorites.private_favorites.find((f) => f.name === 'Favorite');
      if (f) {
        user.hash = f.id_hash;
        user.name = favorites.user_name;
      } else {
        log.warn('Favorite not found?');
      }
    } else {
      log.warn('Failed to retrieve user favorites: ' + e);
    }

    plugin.getUserInfo(function(e, _user) {
      if (!e) {
        user.paid = _user.isCurrentUserPremium;
        user.name = _user.username;
      }
      session.saveUser(user);
      return cb(null, user);
    });
  });
};

plugin.login = function(user, cb) {
  log.debug('running leetcode.login');
  plugin.signin(user, function(e, user) {
    if (e) return cb(e);
    plugin.getUser(user, cb);
  });
};

function parseCookie(cookie, body, cb) {
  const SessionPattern = /LEETCODE_SESSION=(.+?)(;|$)/;
  const csrfPattern = /csrftoken=(.+?)(;|$)/;
  const reCsrfResult = csrfPattern.exec(cookie);
  const reSessionResult = SessionPattern.exec(cookie);
  if (reSessionResult === null || reCsrfResult === null) {
    return cb('invalid cookie?');
  }
  return {
    sessionId:   reSessionResult[1],
    sessionCSRF: reCsrfResult[1],
  };
}

function requestLeetcodeAndSave(request, leetcodeUrl, user, cb) {
  request.get({url: leetcodeUrl}, function(e, resp, body) {
    const redirectUri = resp.request.uri.href;
    if (redirectUri !== config.sys.urls.leetcode_redirect) {
      return cb('Login failed. Please make sure the credential is correct.');
    }
    const cookieData = parseCookie(resp.request.headers.cookie, body, cb);
    user.sessionId = cookieData.sessionId;
    user.sessionCSRF = cookieData.sessionCSRF;
    session.saveUser(user);
    plugin.getUser(user, cb);
  });
}

plugin.cookieLogin = function(user, cb) {
  const cookieData = parseCookie(user.cookie, cb);
  user.sessionId = cookieData.sessionId;
  user.sessionCSRF = cookieData.sessionCSRF;
  session.saveUser(user);
  plugin.getUser(user, cb);
};

plugin.githubLogin = function(user, cb) {
  const urls = config.sys.urls;
  const leetcodeUrl = urls.github_login;
  const _request = request.defaults({jar: true});
  _request(urls.github_login_request, function(e, resp, body) {
    const authenticityToken = body.match(/name="authenticity_token" value="(.*?)"/);
    let gaId = body.match(/name="ga_id" value="(.*?)"/);
    if (!gaId) {
      gaId = '';
    }
    let requiredField = body.match(/name="required_field_(.*?)"/);
    const timestamp = body.match(/name="timestamp" value="(.*?)"/);
    const timestampSecret = body.match(/name="timestamp_secret" value="(.*?)"/);

    if (!(authenticityToken && timestamp && timestampSecret && requiredField)) {
      return cb('Get GitHub payload failed');
    }
    requiredField = 'required_field_' + requiredField[1];
    const options = {
      url:     urls.github_session_request,
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      followAllRedirects: true,
      form:               {
        'login':                   user.login,
        'password':                user.pass,
        'authenticity_token':      authenticityToken[1],
        'commit':                  encodeURIComponent('Sign in'),
        'ga_id':                   gaId,
        'webauthn-support':        'supported',
        'webauthn-iuvpaa-support': 'unsupported',
        'return_to':               '',
        'requiredField':           '',
        'timestamp':               timestamp[1],
        'timestamp_secret':        timestampSecret[1],
      },
    };
    _request(options, function(e, resp, body) {
      if (resp.statusCode !== 200) {
        return cb('GitHub login failed');
      }
      if (resp.request.uri.href !== urls.github_tf_redirect) {
        return requestLeetcodeAndSave(_request, leetcodeUrl, user, cb);
      }
      prompt.colors = false;
      prompt.message = '';
      prompt.start();
      prompt.get([
        {
          name:     'twoFactorCode',
          required: true
        }
      ], function(e, result) {
        if (e) return log.fail(e);
        const authenticityTokenTwoFactor = body.match(/name="authenticity_token" value="(.*?)"/);
        if (authenticityTokenTwoFactor === null) {
          return cb('Get GitHub two-factor token failed');
        }
        const optionsTwoFactor = {
          url:     urls.github_tf_session_request,
          method:  'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          followAllRedirects: true,
          form:               {
            'otp':                result.twoFactorCode,
            'authenticity_token': authenticityTokenTwoFactor[1],
            'utf8':               encodeURIComponent('✓'),
          },
        };
        _request(optionsTwoFactor, function(e, resp, body) {
          if (resp.request.uri.href === urls.github_tf_session_request) {
            return cb('Invalid two-factor code please check');
          }
          requestLeetcodeAndSave(_request, leetcodeUrl, user, cb);
        });
      });
    });
  });
};

plugin.linkedinLogin = function(user, cb) {
  const urls = config.sys.urls;
  const leetcodeUrl = urls.linkedin_login;
  const _request = request.defaults({
    jar:     true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
    }
  });
  _request(urls.linkedin_login_request, function(e, resp, body) {
    if ( resp.statusCode !== 200) {
      return cb('Get LinkedIn session failed');
    }
    const csrfToken = body.match(/input type="hidden" name="csrfToken" value="(.*?)"/);
    const loginCsrfToken = body.match(/input type="hidden" name="loginCsrfParam" value="(.*?)"/);
    const sIdString = body.match(/input type="hidden" name="sIdString" value="(.*?)"/);
    const pageInstance = body.match(/input type="hidden" name="pageInstance" value="(.*?)"/);
    if (!(csrfToken && loginCsrfToken && sIdString && pageInstance)) {
      return cb('Get LinkedIn payload failed');
    }
    const options = {
      url:     urls.linkedin_session_request,
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      followAllRedirects: true,
      form:               {
        'csrfToken':             csrfToken[1],
        'session_key':           user.login,
        'ac':                    2,
        'sIdString':             sIdString[1],
        'parentPageKey':         'd_checkpoint_lg_consumerLogin',
        'pageInstance':          pageInstance[1],
        'trk':                   'public_profile_nav-header-signin',
        'authUUID':              '',
        'session_redirect':      'https://www.linkedin.com/feed/',
        'loginCsrfParam':        loginCsrfToken[1],
        'fp_data':               'default',
        '_d':                    'd',
        'showGoogleOneTapLogin': true,
        'controlId':             'd_checkpoint_lg_consumerLogin-login_submit_button',
        'session_password':      user.pass,
        'loginFlow':             'REMEMBER_ME_OPTIN'
      },
    };
    _request(options, function(e, resp, body) {
      if (resp.statusCode !== 200) {
        return cb('LinkedIn login failed');
      }
      requestLeetcodeAndSave(_request, leetcodeUrl, user, cb);
    });
  });
};

module.exports = plugin;
