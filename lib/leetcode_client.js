var _ = require('underscore');
var cheerio = require('cheerio');
var he = require('he');
var log = require('loglevel');
var request = require('request');

var config = require('./config');
var h = require('./helper');

// update options with user credentials
function signOpts(opts, user) {
  opts.headers.Cookie = 'LEETCODE_SESSION=' + user.sessionId +
                        ';csrftoken=' + user.sessionCSRF + ';';
  opts.headers['X-CSRFToken'] = user.sessionCSRF;
  opts.headers['X-Requested-With'] = 'XMLHttpRequest';
}

function makeOpts(url) {
  var opts = {url: url, headers: {}, _expectedStatus: 200};
  var core = require('./core');
  if (core.isLogin()) signOpts(opts, core.getUser());
  return opts;
}

function checkError(e, resp, expectedStatus, msg) {
  if (e) return e;

  if (resp && resp.statusCode !== expectedStatus) {
    if (resp.statusCode === 403) {
      msg = msg || 'session expired, please login again';

      var core = require('./core');
      core.logout();
    }

    return {
      msg:        msg || 'http error',
      statusCode: resp.statusCode
    };
  }
}

// leetcode.com is limiting one session alive in the same time,
// which means once you login on web, your cli session will get
// expired immediately. In that case we will try to re-login in
// the backend to give a seamless user experience.
function requestWithReLogin(opts, cb) {
  if (!config.AUTO_LOGIN)
    return request(opts, cb);

  var core = require('./core');
  var user = core.getUser();

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, opts._expectedStatus);

    // not 403: transparently pass down
    if (!e || e.statusCode !== 403)
      return cb(e, resp, body);

    // if 403: try re-login
    log.debug('session expired, auto re-login...');

    core.login(user, function(e2, user) {
      if (e2) return cb(e, resp, body);

      log.debug('login successfully, cont\'d...');
      signOpts(opts, user);

      request(opts, cb);
    });
  });
}

var leetcodeClient = {};

leetcodeClient.getProblems = function(cb) {
  var opts = makeOpts(config.URL_PROBLEMS);

  requestWithReLogin(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var json = JSON.parse(body);

    // leetcode permits anonymous access to the problem list
    // while we require login first to make a better experience.
    if (json.user_name.length === 0)
      return cb('session expired, please login again');

    var problems = json.stat_status_pairs
        .filter(function(p) {
          return !p.stat.question__hide;
        })
        .map(function(p) {
          return {
            state:   p.status || 'None',
            id:      p.stat.question_id,
            name:    p.stat.question__title,
            key:     p.stat.question__title_slug,
            link:    config.URL_PROBLEM.replace('$id', p.stat.question__title_slug),
            locked:  p.paid_only,
            percent: p.stat.total_acs * 100 / p.stat.total_submitted,
            level:   h.levelToName(p.difficulty.level),
            starred: p.is_favor
          };
        });

    return cb(null, problems);
  });
};

// hacking ;P
var aceCtrl = {
  init: function() {
    return Array.prototype.slice.call(arguments);
  }
};

leetcodeClient.getProblem = function(problem, cb) {
  var opts = makeOpts();
  opts.url = problem.link;
  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    // FIXME: if session expired, this will still return 200
    if (e) return cb(e);

    var $ = cheerio.load(body);
    var info = $('div[class="question-info text-info"] ul li strong');

    problem.totalAC = $(info[0]).text();
    problem.totalSubmit = $(info[1]).text();
    problem.desc = $('meta[property="og:description"]').attr('content');
    problem.desc = he.decode(problem.desc);

    var pageData;
    var r = /(var pageData[^;]+;)/m;
    var result = body.match(r);
    if (!result)
      return cb('failed to load' + (problem.locked ? ' locked ' : ' ') +
                'problem!');

    eval(result[1]);
    problem.templates = pageData.codeDefinition;
    problem.testcase = pageData.sampleTestCase;
    problem.testable = pageData.enableRunCode;

    return cb(null, problem);
  });
};

leetcodeClient.getSubmissions = function(problem, cb) {
  var opts = makeOpts();
  opts.url = config.URL_SUBMISSIONS.replace('$key', problem.key);
  opts.headers.Referer = config.URL_PROBLEM.replace('$id', problem.key);

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    // FIXME: if session expired, this will still return 200
    if (e) return cb(e);

    // FIXME: this only return the 1st 20 submissions, we should get next if necessary.
    var submissions = JSON.parse(body).submissions_dump;
    _.each(submissions, function(submission) {
      submission.id = _.last(_.compact(submission.url.split('/')));
    });

    return cb(null, submissions);
  });
};

leetcodeClient.getSubmission = function(submission, cb) {
  var opts = makeOpts();
  opts.url = config.URL_SUBMISSION.replace('$id', submission.id);

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var re = body.match(/submissionCode:\s('[^']*')/);
    if (re) {
      submission.code = eval(re[1]);
    }
    return cb(null, submission);
  });
};

leetcodeClient.login = function(user, cb) {
  request(config.URL_LOGIN, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    user.loginCSRF = h.getSetCookieValue(resp, 'csrftoken');

    var opts = {
      url:     config.URL_LOGIN,
      headers: {
        Origin:  config.URL_BASE,
        Referer: config.URL_LOGIN,
        Cookie:  'csrftoken=' + user.loginCSRF + ';'
      },
      form: {
        csrfmiddlewaretoken: user.loginCSRF,
        login:               user.login,
        password:            user.pass
      }
    };
    request.post(opts, function(e, resp, body) {
      e = checkError(e, resp, 302, 'invalid password?');
      if (e) return cb(e);

      user.sessionCSRF = h.getSetCookieValue(resp, 'csrftoken');
      user.sessionId = h.getSetCookieValue(resp, 'LEETCODE_SESSION');
      user.name = h.getSetCookieValue(resp, 'messages')
                   .match('Successfully signed in as ([^.]*)')[1];

      return cb(null, user);
    });
  });
};

function verifyResult(opts, jobs, results, cb) {
  if (jobs.length === 0)
    return cb(null, results);

  opts.method = 'GET';
  opts.url = config.URL_VERIFY.replace('$id', jobs[0].id);

  requestWithReLogin(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var result = JSON.parse(body);
    if (result.state === 'SUCCESS') {
      result.name = jobs[0].name;
      results.push(result);
      jobs.shift();
    }

    setImmediate(verifyResult, opts, jobs, results, cb);
  });
}

function runCode(opts, problem, cb) {
  opts.method = 'POST';
  opts.headers.Origin = config.URL_BASE;
  opts.headers.Referer = problem.link;
  opts.json = true;
  opts._delay = opts._delay || 1; // in seconds

  opts.body = opts.body || {};
  _.extendOwn(opts.body, {
    'lang':        h.extToLang(problem.file),
    'question_id': parseInt(problem.id, 10),
    'test_mode':   false,
    'typed_code':  h.getFileData(problem.file)
  });

  requestWithReLogin(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    if (body.error) {
      if (body.error.indexOf('run code too soon') < 0)
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

leetcodeClient.testProblem = function(problem, cb) {
  var opts = makeOpts();
  opts.url = config.URL_TEST.replace('$key', problem.key);
  opts.body = {'data_input': problem.testcase};

  runCode(opts, problem, function(e, task) {
    if (e) return cb(e);

    var jobs = [
      {name: 'Your', id: task.interpret_id},
      {name: 'Expected', id: task.interpret_expected_id}
    ];
    verifyResult(opts, jobs, [], cb);
  });
};

leetcodeClient.submitProblem = function(problem, cb) {
  var opts = makeOpts();
  opts.url = config.URL_SUBMIT.replace('$key', problem.key);
  opts.body = {'judge_type': 'large'};

  runCode(opts, problem, function(e, task) {
    if (e) return cb(e);

    var jobs = [{name: 'Your', id: task.submission_id}];
    verifyResult(opts, jobs, [], cb);
  });
};

leetcodeClient.starProblem = function(problem, starred, cb) {
  var opts = makeOpts(config.URL_STAR);
  opts.method = (starred ? 'POST' : 'DELETE');
  opts.headers.Origin = config.URL_BASE;
  opts.headers.Referer = problem.link;
  opts.json = true;
  opts.body = {'qid': problem.id};

  requestWithReLogin(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    cb(null, body.is_favor);
  });
};

module.exports = leetcodeClient;
