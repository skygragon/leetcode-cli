var cheerio = require('cheerio');
var request = require('request');

var config = require('./config');
var h = require('./helper');

// update options with user credentials
function signOpts(opts, user) {
  opts.headers.Cookie = 'PHPSESSID=' + user.sessionId +
                        ';csrftoken=' + user.sessionCSRF + ';';
  opts.headers['X-CSRFToken'] = user.sessionCSRF;
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
    console.log('session expired, auto re-login...');

    core.login(user, function(e2, user) {
      if (e2) return cb(e, resp, body);

      console.log('login successfully, cont\'d...');
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
            level:   h.levelToName(p.difficulty.level)
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
  request(problem.link, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var $ = cheerio.load(body);
    var info = $('div[class="question-info text-info"] ul li strong');

    problem.totalAC = $(info[0]).text();
    problem.totalSubmit = $(info[1]).text();
    problem.desc = $('meta[property="og:description"]').attr('content');

    var raw = $('div[ng-controller="AceCtrl as aceCtrl"]').attr('ng-init');
    if (!raw)
      return cb('failed to load' + (problem.locked ? ' locked ' : ' ') +
                'problem!');

    raw = raw.replace(/\n/g, ''); // FIXME: might break test cases!
    var args = eval(raw);
    problem.templates = args[0];

    return cb(null, problem);
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
      user.sessionId = h.getSetCookieValue(resp, 'PHPSESSID');
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

leetcodeClient.testProblem = function(problem, cb) {
  var opts = makeOpts();
  opts.method = 'POST';
  opts.url = config.URL_TEST.replace('$key', problem.key);
  opts.headers.Origin = config.URL_BASE;
  opts.headers.Referer = problem.link;
  opts.headers['X-Requested-With'] = 'XMLHttpRequest';
  opts.json = true;
  opts.body = {
    'data_input':  problem.testcase,
    'lang':        h.extToLang(problem.file),
    'question_id': parseInt(problem.id, 10),
    'test_mode':   false,
    'typed_code':  h.getFileData(problem.file)
  };

  requestWithReLogin(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    opts.json = false;
    opts.body = null;

    var jobs = [
      {name: 'Your', id: body.interpret_id},
      {name: 'Expected', id: body.interpret_expected_id}
    ];
    verifyResult(opts, jobs, [], cb);
  });
};

leetcodeClient.submitProblem = function(problem, cb) {
  var opts = makeOpts();
  opts.method = 'POST';
  opts.url = config.URL_SUBMIT.replace('$key', problem.key);
  opts.headers.Origin = config.URL_BASE;
  opts.headers.Referer = problem.link;
  opts.headers['X-Requested-With'] = 'XMLHttpRequest';
  opts.json = true;
  opts.body = {
    'judge_type':  'large',
    'lang':        h.extToLang(problem.file),
    'question_id': parseInt(problem.id, 10),
    'test_mode':   false,
    'typed_code':  h.getFileData(problem.file)
  };

  requestWithReLogin(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    opts.json = false;
    opts.body = null;

    var jobs = [{name: 'Your', id: body.submission_id}];
    verifyResult(opts, jobs, [], cb);
  });
};

module.exports = leetcodeClient;
