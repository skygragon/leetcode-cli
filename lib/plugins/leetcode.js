var util = require('util');

var _ = require('underscore');
var cheerio = require('cheerio');
var he = require('he');
var request = require('request');

var config = require('../config');
var h = require('../helper');
var log = require('../log');
var Plugin = require('../plugin');
var queue = require('../queue');
var session = require('../session');

var plugin = new Plugin(10, 'leetcode', '',
    'Plugin to talk with leetcode APIs.');

// update options with user credentials
function signOpts(opts, user) {
  opts.headers.Cookie = 'LEETCODE_SESSION=' + user.sessionId +
                        ';csrftoken=' + user.sessionCSRF + ';';
  opts.headers['X-CSRFToken'] = user.sessionCSRF;
  opts.headers['X-Requested-With'] = 'XMLHttpRequest';
}

function makeOpts(url) {
  var opts = {};
  opts.url = url;
  opts.headers = {};

  if (session.isLogin())
    signOpts(opts, session.getUser());
  return opts;
}

function checkError(e, resp, expectedStatus) {
  if (!e && resp && resp.statusCode !== expectedStatus) {
    var code = resp.statusCode;
    log.debug('http error: ' + code);

    if (code === 403 || code === 401) {
      e = session.errors.EXPIRED;
    } else {
      e = {msg: 'http error', statusCode: code};
    }
  }
  return e;
}

plugin.getProblems = function(cb) {
  log.debug('running leetcode.getProblems');

  var problems = [];
  var doTask = function(category, taskDone) {
    plugin.getCategoryProblems(category, function(e, _problems) {
      if (e) {
        log.debug(category + ': failed to getProblems: ' + e.msg);
      } else {
        log.debug(category + ': getProblems got ' + _problems.length + ' problems');
        problems = problems.concat(_problems);
      }
      return taskDone(e);
    });
  };

  queue.run(config.sys.categories, doTask, function(e) {
    return cb(e, problems);
  });
};

plugin.getCategoryProblems = function(category, cb) {
  log.debug('running leetcode.getCategoryProblems: ' + category);
  var opts = makeOpts(config.sys.urls.problems.replace('$category', category));

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var json = JSON.parse(body);

    // leetcode permits anonymous access to the problem list
    // while we require login first to make a better experience.
    if (json.user_name.length === 0) {
      log.debug('no user info in list response, maybe session expired...');
      return cb(session.errors.EXPIRED);
    }

    var user = session.getUser();
    user.paid = json.is_paid;
    session.saveUser(user);

    var problems = json.stat_status_pairs
        .filter(function(p) {
          return !p.stat.question__hide;
        })
        .map(function(p) {
          return {
            state:    p.status || 'None',
            id:       p.stat.question_id,
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
  var user = session.getUser();
  if (problem.locked && !user.paid) return cb('failed to load locked problem!');

  var opts = makeOpts(config.sys.urls.problem_detail);
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
      '    discussCategoryId',
      '  }',
      '}'
    ].join('\n'),
    variables:     {titleSlug: problem.slug},
    operationName: 'getQuestionDetail'
  };

  request.post(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var q = body.data.question;
    if (!q) return cb('failed to load problem!');

    problem.totalAC = JSON.parse(q.stats).totalAccepted;
    problem.totalSubmit = JSON.parse(q.stats).totalSubmission;
    problem.desc = he.decode(cheerio.load(q.content).root().text());
    problem.templates = JSON.parse(q.codeDefinition);
    problem.testcase = q.sampleTestCase;
    problem.testable = q.enableRunCode;
    problem.templateMeta = JSON.parse(q.metaData);
    problem.discuss =  q.discussCategoryId;

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
    lang:        h.extToLang(problem.file),
    question_id: parseInt(problem.id, 10),
    test_mode:   false,
    typed_code:  h.getFileData(problem.file)
  });

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    if (body.error) {
      if (body.error.indexOf('too soon') < 0)
        return cb(body.error);

      // hit 'run code too soon' error, have to wait a bit
      log.debug(body.error);

      // linear wait
      ++opts._delay;
      log.debug('Will retry after %d seconds...', opts._delay);

      var reRun = _.partial(runCode, opts, problem, cb);
      return setTimeout(reRun, opts._delay * 1000);
    }

    opts.json = false;
    opts.body = null;

    return cb(null, body);
  });
}

function verifyResult(opts, jobs, results, cb) {
  if (jobs.length === 0) return cb(null, results);

  opts.method = 'GET';
  opts.url = config.sys.urls.verify.replace('$id', jobs[0].id);

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var result = JSON.parse(body);
    if (result.state === 'SUCCESS') {
      result = formatResult(result);
      _.extendOwn(result, jobs[0]);
      results.push(result);
      jobs.shift();
    }

    setImmediate(verifyResult, opts, jobs, results, cb);
  });
}

function formatResult(result) {
  var x = {
    ok:       result.run_success,
    answer:   result.code_answer || '',
    runtime:  result.status_runtime || '',
    state:    h.statusToName(result.status_code),
    testcase: util.inspect(result.input || result.last_testcase || ''),
    passed:   result.total_correct || 0,
    total:    result.total_testcases || 0
  };

  x.error = _.chain(result)
    .pick(function(v, k) {
      return /_error$/.test(k) && v.length > 0;
    })
    .values()
    .value();

  if (result.judge_type === 'large') {
    x.answer = result.code_output;
    x.expected_answer = result.expected_output;
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
  var opts = makeOpts(config.sys.urls.test.replace('$slug', problem.slug));
  opts.body = {data_input: problem.testcase};

  runCode(opts, problem, function(e, task) {
    if (e) return cb(e);

    var jobs = [
      {type: 'Actual', id: task.interpret_id},
      {type: 'Expected', id: task.interpret_expected_id}
    ];
    verifyResult(opts, jobs, [], cb);
  });
};

plugin.submitProblem = function(problem, cb) {
  log.debug('running leetcode.submitProblem');
  var opts = makeOpts(config.sys.urls.submit.replace('$slug', problem.slug));
  opts.body = {judge_type: 'large'};

  runCode(opts, problem, function(e, task) {
    if (e) return cb(e);

    var jobs = [{type: 'Actual', id: task.submission_id}];
    verifyResult(opts, jobs, [], cb);
  });
};

plugin.getSubmissions = function(problem, cb) {
  log.debug('running leetcode.getSubmissions');
  var opts = makeOpts(config.sys.urls.submissions.replace('$slug', problem.slug));
  opts.headers.Referer = config.sys.urls.problem.replace('$slug', problem.slug);

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    // FIXME: this only return the 1st 20 submissions, we should get next if necessary.
    var submissions = JSON.parse(body).submissions_dump;
    _.each(submissions, function(submission) {
      submission.id = _.last(_.compact(submission.url.split('/')));
    });

    return cb(null, submissions);
  });
};

plugin.getSubmission = function(submission, cb) {
  log.debug('running leetcode.getSubmission');
  var opts = makeOpts(config.sys.urls.submission.replace('$id', submission.id));

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var re = body.match(/submissionCode:\s('[^']*')/);
    if (re) submission.code = eval(re[1]);

    re = body.match(/distribution_formatted:\s('[^']+')/);
    if (re) submission.distributionChart = JSON.parse(eval(re[1]));
    return cb(null, submission);
  });
};

plugin.starProblem = function(problem, starred, cb) {
  log.debug('running leetcode.starProblem');
  var opts = makeOpts();
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = problem.link;

  var user = session.getUser();
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
  var opts = makeOpts(config.sys.urls.favorites);

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var favorites = JSON.parse(body);
    return cb(null, favorites);
  });
};

plugin.signin = function(user, cb) {
  log.debug('running leetcode.signin');
  request(config.sys.urls.login, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    user.loginCSRF = h.getSetCookieValue(resp, 'csrftoken');

    var opts = {
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
    if (e) return cb(e);

    var favorite = _.find(favorites.favorites.private_favorites, function(f) {
      return f.name === 'Favorite';
    });
    user.hash = favorite.id_hash;
    user.name = favorites.user_name;
    session.saveUser(user);
    return cb(null, user);
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
