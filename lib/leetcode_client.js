var _ = require('underscore');
var cheerio = require('cheerio');
var request = require('request');

var config = require('./config');
var h = require('./helper');

function makeOpts(url) {
  var opts = {url: url, headers: {}};
  var core = require('./core');
  if (core.isLogin()) {
    var user = core.getUser();
    opts.headers.Cookie = 'PHPSESSID=' + user.sessionId +
                             ';csrftoken=' + user.sessionCSRF + ';';
    opts.headers['X-CSRFToken'] = user.sessionCSRF;
  }
  return opts;
}

var leetcodeClient = {};

leetcodeClient.getProblems = function(cb) {
  request(makeOpts(config.PROBLEMS_URL), function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode !== 200) return cb('HTTP failed:' + resp.statusCode);

    var problemsListJson = JSON.parse(body);
    var problems = [];
    problemsListJson.stat_status_pairs.forEach(function(problemData) {
      var problem = {
        state:   problemData['status'],
        id:      problemData['stat']['question_id'].toString(),
        name:    problemData['stat']['question__title'],
        key:     problemData['stat']['question__title_slug'],
        link:    config.PROBLEM_URL + problemData['stat']['question__title_slug'],
        locked:  problemData['paid_only'],
        level:   parseDifficulty(problemData['difficulty']['level'])
      };
      var percent = parseInt(problemData['stat']['total_acs'], 10) / parseInt(problemData['stat']['total_submitted'], 10) * 100;
      problem.percent = percent.toFixed(1).toString() + '%';
      problems.push(problem);
    });

    return cb(null, problems);
  });
};

function parseDifficulty(level) {
  switch (level) {
    case 1 : return 'Easy';
    case 2 : return 'Medium';
    case 3 : return 'Hard';
    default : return 'Unknown Difficulty';
  }
}

// hacking ;P
var aceCtrl = {
  init: function() {
    return Array.prototype.slice.call(arguments);
  }
};

leetcodeClient.getProblem = function(problem, cb) {
  request(problem.link, function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode !== 200) return cb('HTTP failed:' + resp.statusCode);

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
  request(config.LOGIN_URL, function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode !== 200) return cb('HTTP failed:' + resp.statusCode);

    user.loginCSRF = h.getSetCookieValue(resp, 'csrftoken');

    var opts = {
      url:     config.LOGIN_URL,
      headers: {
        Origin:  config.BASE_URL,
        Referer: config.LOGIN_URL,
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
      if (resp.statusCode !== 302) return cb('HTTP failed:' + resp.statusCode);

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

  opts.url = config.VERIFY_URL.replace('$id', jobs[0].id);
  request.get(opts, function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode !== 200) return cb('HTTP failed:' + resp.statusCode);

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
  opts.url = config.TEST_URL.replace('$key', problem.key);
  opts.headers.Origin = config.BASE_URL;
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

  request.post(opts, function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode !== 200) return cb('HTTP failed:' + resp.statusCode);

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
  opts.url = config.SUBMIT_URL.replace('$key', problem.key);
  opts.headers.Origin = config.BASE_URL;
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

  request.post(opts, function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode !== 200) return cb('HTTP failed:' + resp.statusCode);

    opts.json = false;
    opts.body = null;

    var jobs = [{name: 'Your', id: body.submission_id}];
    verifyResult(opts, jobs, [], cb);
  });
};

module.exports = leetcodeClient;
