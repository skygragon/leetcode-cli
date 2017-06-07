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

function makeOpts(url, expectedStatus) {
  var opts = {};
  opts.url = url;
  opts.headers = {};
  opts.expectedStatus = expectedStatus || 200;
  opts.retry = 0;

  var core = require('./core');
  if (core.isLogin()) signOpts(opts, core.getUser());
  return opts;
}

var EXPIRED_ERROR = {
  msg:        'session expired, please login again',
  statusCode: -1
};

function checkError(e, resp, expectedStatus, msg) {
  if (!e && resp && resp.statusCode !== expectedStatus) {
    var code = resp.statusCode;
    if (code === 403 || code === 401) {
      e = EXPIRED_ERROR;
      log.debug('session expired:' + code);
    } else {
      e = {msg: msg || 'http error', statusCode: code};
    }
  }
  return e;
}

function relogin(opts, cb) {
  log.debug('session expired, try to re-login...');
  ++opts.retry;

  var core = require('./core');
  var user = core.getUser();
  if (!user) {
    log.debug('login failed: no user found, please login again');
    return cb();
  }

  core.login(user, function(e, user) {
    if (e) {
      log.debug('login failed:' + e);
    } else {
      log.debug('login successfully, cont\'d...');
      signOpts(opts, user);
    }
    // for now we don't care result, just blindly retry
    return cb();
  });
}

// leetcode.com is limiting one session alive in the same time,
// which means once you login on web, your cli session will get
// expired immediately. In that case we will try to re-login in
// the backend to give a seamless user experience.
function requestWithReLogin(opts, cb) {
  if (opts.retry > 1) return cb(EXPIRED_ERROR);

  var req = request(opts, function(e, resp, body) {
    e = checkError(e, resp, opts.expectedStatus);

    if (e === EXPIRED_ERROR && config.AUTO_LOGIN) {
      relogin(opts, function() {
        requestWithReLogin(opts, cb);
      });
      return;
    }

    try {
      return cb(e, resp, body, req);
    } catch (e2) {
      if (e2 === EXPIRED_ERROR && config.AUTO_LOGIN) {
        relogin(opts, function() {
          requestWithReLogin(opts, cb);
        });
        return;
      }
      return cb(e2);
    }
  });
}

var leetcodeClient = {};

leetcodeClient.getProblems = function(user, cb) {
  var opts = makeOpts(config.URL_PROBLEMS);

  requestWithReLogin(opts, function(e, resp, body) {
    if (e) return cb(e);

    var json = JSON.parse(body);

    // leetcode permits anonymous access to the problem list
    // while we require login first to make a better experience.
    if (json.user_name.length === 0) {
      log.debug('no user info in list response, maybe session expired...');
      throw EXPIRED_ERROR;
    }
    user.paid = json.is_paid;

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

leetcodeClient.getProblem = function(user, problem, cb) {
  var opts = makeOpts();
  opts.url = problem.link;
  requestWithReLogin(opts, function(e, resp, body) {
    if (e) return cb(e);

    var $ = cheerio.load(body);
    var info = $('div[class^=question-info] ul li strong');

    problem.totalAC = $(info[0]).text();
    problem.totalSubmit = $(info[1]).text();
    // TODO: revisit this if later leetcode remove this element.
    //       Then we need parse the body to get the description.
    problem.desc = $('meta[name="description"]').attr('content');
    problem.desc = he.decode(problem.desc);

    var pageData;
    var r = /(var pageData[^;]+;)/m;
    var result = body.match(r);
    if (!result) {
      if (problem.locked && user.paid) throw EXPIRED_ERROR;
      return cb('failed to load' + (problem.locked ? ' locked ' : ' ') +
                'problem!');
    }

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

  requestWithReLogin(opts, function(e, resp, body) {
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

  requestWithReLogin(opts, function(e, resp, body) {
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

leetcodeClient.getFavorites = function(cb) {
  var opts = makeOpts();
  opts.method = 'GET';
  opts.url = config.URL_FAVORITES;

  requestWithReLogin(opts, function(e, resp, body) {
    if (e) return cb(e);

    var favorites = JSON.parse(body);
    return cb(null, favorites);
  });
};

function verifyResult(opts, jobs, results, cb) {
  if (jobs.length === 0)
    return cb(null, results);

  opts.method = 'GET';
  opts.url = config.URL_VERIFY.replace('$id', jobs[0].id);

  requestWithReLogin(opts, function(e, resp, body) {
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

leetcodeClient.starProblem = function(user, problem, starred, cb) {
  var opts = makeOpts(null, 204);
  if (starred) {
    opts.url = config.URL_FAVORITES;
    opts.method = 'POST';
    opts.json = true;
    opts.body = {
      'favorite_id_hash': user.hash,
      'question_id':      problem.id
    };
  } else {
    opts.url = config.URL_FAVORITE_DELETE
      .replace('$hash', user.hash)
      .replace('$id', problem.id);
    opts.method = 'DELETE';
  }
  opts.headers.Origin = config.URL_BASE;
  opts.headers.Referer = problem.link;

  requestWithReLogin(opts, function(e, resp, body, req) {
    // FIXME: not sure why we hit HPE_INVALID_CONSTANT error?
    if (req && req.response && req.response.statusCode === 204)
      return cb(null, starred);

    if (e) return cb(e);
    cb(null, starred);
  });
};

module.exports = leetcodeClient;
