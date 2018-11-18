'use strict';
var util = require('util');

var _ = require('underscore');
var cheerio = require('cheerio');
var he = require('he');
var request = require('request');

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
function signOpts(opts, user) {
  opts.headers.Cookie = 'LEETCODE_SESSION=' + user.sessionId +
                        ';csrftoken=' + user.sessionCSRF + ';';
  opts.headers['X-CSRFToken'] = user.sessionCSRF;
  opts.headers['X-Requested-With'] = 'XMLHttpRequest';
}

function makeOpts(url) {
  const opts = {};
  opts.url = url;
  opts.headers = {};

  if (session.isLogin())
    signOpts(opts, session.getUser());
  return opts;
}

function checkError(e, resp, expectedStatus) {
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
}

plugin.init = function() {
  config.app = 'leetcode';
}

plugin.getProblems = function(cb) {
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
  const opts = makeOpts(config.sys.urls.problems.replace('$category', category));

  spin.text = 'Downloading category ' + category;
  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    const json = JSON.parse(body);

    // leetcode permits anonymous access to the problem list
    // while we require login first to make a better experience.
    if (json.user_name.length === 0) {
      log.debug('no user info in list response, maybe session expired...');
      return cb(session.errors.EXPIRED);
    }

    const problems = json.stat_status_pairs
        .filter(p => !p.stat.question__hide)
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

plugin.getProblem = function(problem, cb) {
  log.debug('running leetcode.getProblem');
  const user = session.getUser();
  if (problem.locked && !user.paid) return cb('failed to load locked problem!');

  const opts = makeOpts(config.sys.urls.graphql);
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = problem.link;

  opts.json = true;
  opts.body = {
    query: [
      'query getQuestionDetail($titleSlug: String!) {',
      '  question(titleSlug: $titleSlug) {',
      '    content',
      '    stats',
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
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    const q = body.data.question;
    if (!q) return cb('failed to load problem!');

    problem.totalAC = JSON.parse(q.stats).totalAccepted;
    problem.totalSubmit = JSON.parse(q.stats).totalSubmission;
    if (!q.translatedContent) {
        problem.desc = he.decode(cheerio.load(q.content).root().text());
    }else{
        problem.desc = he.decode(cheerio.load(q.translatedContent).root().text());
    }
    problem.templates = JSON.parse(q.codeDefinition);
    problem.testcase = q.sampleTestCase;
    problem.testable = q.enableRunCode;
    problem.templateMeta = JSON.parse(q.metaData);
    // @si-yao: seems below property is never used.
    //problem.discuss =  q.discussCategoryId;

    return cb(null, problem);
  });
};

function runCode(opts, problem, cb) {
  opts.method = 'POST';
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = problem.link;
  opts.json = true;
  opts._delay = opts._delay || 1; // in seconds

  opts.body = opts.body || {};
  _.extendOwn(opts.body, {
    lang:        problem.lang,
    question_id: parseInt(problem.id, 10),
    test_mode:   false,
    typed_code:  file.data(problem.file)
  });

  const spin = h.spin('Sending code to judge');
  request(opts, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
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
    e = checkError(e, resp, 200);
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
    ok:       result.run_success,
    answer:   result.code_answer || '',
    runtime:  result.status_runtime || '',
    state:    h.statusToName(result.status_code),
    testcase: util.inspect(result.input || result.last_testcase || ''),
    passed:   result.total_correct || 0,
    total:    result.total_testcases || 0
  };

  x.error = _.chain(result)
    .pick((v, k) => /_error$/.test(k) && v.length > 0)
    .values()
    .value();

  if (result.judge_type === 'large') {
    x.answer = result.code_output;
    x.expected_answer = result.expected_output;
    x.stdout = result.std_output;
  } else {
    x.stdout = util.inspect((result.code_output || []).join('\n'));
  }

  // make sure we pass eveything!
  if (x.passed !== x.total) x.ok = false;
  if (x.state !== 'Accepted') x.ok = false;
  if (x.error.length > 0) x.ok = false;

  return x;
}

plugin.testProblem = function(problem, cb) {
  log.debug('running leetcode.testProblem');
  const opts = makeOpts(config.sys.urls.test.replace('$slug', problem.slug));
  opts.body = {data_input: problem.testcase};

  runCode(opts, problem, function(e, task) {
    if (e) return cb(e);

    const tasks = [
      {type: 'Actual', id: task.interpret_id},
      {type: 'Expected', id: task.interpret_expected_id}
    ];
    const q = new Queue(tasks, {opts: opts, results: []}, verifyResult);
    q.run(null, function(e, ctx) {
      return cb(e, ctx.results);
    });
  });
};

plugin.submitProblem = function(problem, cb) {
  log.debug('running leetcode.submitProblem');
  const opts = makeOpts(config.sys.urls.submit.replace('$slug', problem.slug));
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
  const opts = makeOpts(config.sys.urls.submissions.replace('$slug', problem.slug));
  opts.headers.Referer = config.sys.urls.problem.replace('$slug', problem.slug);

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    // FIXME: this only return the 1st 20 submissions, we should get next if necessary.
    const submissions = JSON.parse(body).submissions_dump;
    for (let submission of submissions)
      submission.id = _.last(_.compact(submission.url.split('/')));

    return cb(null, submissions);
  });
};

plugin.getSubmission = function(submission, cb) {
  log.debug('running leetcode.getSubmission');
  const opts = makeOpts(config.sys.urls.submission.replace('$id', submission.id));

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    let re = body.match(/submissionCode:\s('[^']*')/);
    if (re) submission.code = eval(re[1]);

    re = body.match(/distribution_formatted:\s('[^']+')/);
    if (re) submission.distributionChart = JSON.parse(eval(re[1]));
    return cb(null, submission);
  });
};

plugin.starProblem = function(problem, starred, cb) {
  log.debug('running leetcode.starProblem');
  const opts = makeOpts();
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = problem.link;

  const user = session.getUser();
  if (starred) {
    opts.url = config.sys.urls.favorites;
    opts.method = 'POST';
    opts.json = true;
    opts.body = {
      favorite_id_hash: user.hash,
      question_id:      problem.id
    };
  } else {
    opts.url = config.sys.urls.favorite_delete
      .replace('$hash', user.hash)
      .replace('$id', problem.id);
    opts.method = 'DELETE';
  }

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 204);
    if (e) return cb(e);

    cb(null, starred);
  });
};

plugin.getFavorites = function(cb) {
  log.debug('running leetcode.getFavorites');
  const opts = makeOpts(config.sys.urls.favorites);

  const spin = h.spin('Retrieving user favorites');
  request(opts, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    const favorites = JSON.parse(body);
    return cb(null, favorites);
  });
};

plugin.getUserInfo = function(cb) {
  log.debug('running leetcode.getUserInfo');
  const opts = makeOpts(config.sys.urls.graphql);
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
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    const user = body.data.user;
    return cb(null, user);
  });
};

function runSession(method, data, cb) {
  const opts = makeOpts(config.sys.urls.session);
  opts.json = true;
  opts.method = method;
  opts.body = data;

  const spin = h.spin('Waiting session result');
  request(opts, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
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
  log.debug('running leetcode.signin');
  const spin = h.spin('Signing in leetcode.com');
  request(config.sys.urls.login, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
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
      const f = favorites.favorites.private_favorites.find(f => f.name === 'Favorite');
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

module.exports = plugin;
