var _ = require('underscore');
var cheerio = require('cheerio');
var request = require('request');
var util = require('util');

var h = require('../helper');
var file = require('../file');
var config = require('../config');
var log = require('../log');
var Plugin = require('../plugin');
var Queue = require('../queue');
var session = require('../session');

// Still working in progress!
//
// TODO: star/submissions/submission
// FIXME: why [ERROR] Error: read ECONNRESET [0]??
//
// [Usage]
//
// https://github.com/skygragon/leetcode-cli-plugins/blob/master/docs/lintcode.md
//
const plugin = new Plugin(15, 'lintcode', '2018.11.18',
    'Plugin to talk with lintcode APIs.');

// FIXME: add more langs
const LANGS = [
  {value: 'cpp', text: 'C++'},
  {value: 'java', text: 'Java'},
  {value: 'python', text: 'Python'}
];

const LEVELS = {
  0: 'Naive',
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
  4: 'Super'
};

var spin;

function signOpts(opts, user) {
  opts.headers.Cookie = 'sessionid=' + user.sessionId +
                        ';csrftoken=' + user.sessionCSRF + ';';
  opts.headers['x-csrftoken'] = user.sessionCSRF;
}

function makeOpts(url) {
  const opts = {
    url:     url,
    headers: {}
  };
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

function _split(s, delim) {
  return (s || '').split(delim).map(function(x) {
    return x.trim();
  }).filter(function(x) {
    return x.length > 0;
  });
}

function _strip(s) {
  s = s.replace(/^<pre><code>/, '').replace(/<\/code><\/pre>$/, '');
  return util.inspect(s.trim());
}

plugin.init = function() {
  config.app = 'lintcode';
  config.sys.urls.base           = 'https://www.lintcode.com';
  config.sys.urls.problems       = 'https://www.lintcode.com/api/problems/?page=$page';
  config.sys.urls.problem        = 'https://www.lintcode.com/problem/$slug/description';
  config.sys.urls.problem_detail = 'https://www.lintcode.com/api/problems/detail/?unique_name_or_alias=$slug&_format=detail';
  config.sys.urls.problem_code   = 'https://www.lintcode.com/api/problems/$id/reset/?language=$lang';
  config.sys.urls.test           = 'https://www.lintcode.com/api/submissions/';
  config.sys.urls.test_verify    = 'https://www.lintcode.com/api/submissions/refresh/?id=$id&is_test_submission=true';
  config.sys.urls.submit_verify  = 'https://www.lintcode.com/api/submissions/refresh/?id=$id';
  config.sys.urls.login          = 'https://www.lintcode.com/api/accounts/signin/?next=%2F';
};

plugin.getProblems = function(cb) {
  log.debug('running lintcode.getProblems');

  var problems = [];
  const getPage = function(page, queue, cb) {
    plugin.getPageProblems(page, function(e, _problems, ctx) {
      if (!e) {
        problems = problems.concat(_problems);
        queue.tasks = _.reject(queue.tasks, x => ctx.pages > 0 && x > ctx.pages);
      }
      return cb(e);
    });
  };

  const pages = _.range(1, 100);
  const q = new Queue(pages, {}, getPage);
  spin = h.spin('Downloading problems');
  q.run(null, function(e, ctx) {
    spin.stop();
    problems = _.sortBy(problems, x => -x.id);
    return cb(e, problems);
  });
};

plugin.getPageProblems = function(page, cb) {
  log.debug('running lintcode.getPageProblems: ' + page);
  const opts = makeOpts(config.sys.urls.problems.replace('$page', page));

  spin.text = 'Downloading page ' + page;
  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    const ctx = {};
    const json = JSON.parse(body);
    const problems = json.problems.map(function(p, a) {
      const problem = {
        id:        p.id, 
        fid:       p.id,
        name:      p.title,
        slug:      p.unique_name,
        category:  'lintcode',
        level:     LEVELS[p.level],
        locked:    false,
        percent:   p.accepted_rate,
        starred:   p.is_favorited,
        companies: p.company_tags,
        tags:      []
      };
      problem.link = config.sys.urls.problem.replace('$slug', problem.slug);
      switch (p.user_status) {
        case 'Accepted': problem.state = 'ac'; break;
        case 'Failed':   problem.state = 'notac'; break;
        default:         problem.state = 'None';
      }
      return problem;
    });

    ctx.count = json.count;
    ctx.pages = json.maximum_page;
    return cb(null, problems, ctx);
  });
};

plugin.getProblem = function(problem, cb) {
  log.debug('running lintcode.getProblem');
  const link = config.sys.urls.problem_detail.replace('$slug', problem.slug);
  const opts = makeOpts(link);

  const spin = h.spin('Downloading ' + problem.slug);
  request(opts, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    const json = JSON.parse(body);
    problem.testcase = json.testcase_sample;
    problem.testable = problem.testcase.length > 0;
    problem.tags = json.tags.map(x => x.name);
    problem.desc = cheerio.load(json.description).root().text();
    problem.totalAC = json.total_accepted;
    problem.totalSubmit = json.total_submissions;
    problem.templates = [];

    const getLang = function(lang, queue, cb) {
      plugin.getProblemCode(problem, lang, function(e, code) {
        if (!e) {
          lang = _.clone(lang);
          lang.defaultCode = code;
          problem.templates.push(lang);
        }
        return cb(e);
      });
    };

    const q = new Queue(LANGS, {}, getLang);
    q.run(null, e => cb(e, problem));
  });
};

plugin.getProblemCode = function(problem, lang, cb) {
  log.debug('running lintcode.getProblemCode:' + lang.value);
  const url = config.sys.urls.problem_code.replace('$id', problem.id)
                                          .replace('$lang', lang.text.replace(/\+/g, '%2B'));
  const opts = makeOpts(url);

  const spin = h.spin('Downloading code for ' + lang.text);
  request(opts, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var json = JSON.parse(body);
    return cb(null, json.code);
  });
};

function runCode(problem, isTest, cb) {
  const lang = _.find(LANGS, x => x.value === h.extToLang(problem.file));
  const opts = makeOpts(config.sys.urls.test);
  opts.headers.referer = problem.link;
  opts.form = {
    problem_id: problem.id,
    code:       file.data(problem.file),
    language:   lang.text
  };
  if (isTest) {
    opts.form.input = problem.testcase;
    opts.form.is_test_submission = true;
  }

  spin = h.spin('Sending code to judge');
  request.post(opts, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var json = JSON.parse(body);
    if (!json.id) return cb('Failed to start judge!');

    spin = h.spin('Waiting for judge result');
    verifyResult(json.id, isTest, cb);
  });
}

function verifyResult(id, isTest, cb) {
  log.debug('running verifyResult:' + id);
  var url = isTest ? config.sys.urls.test_verify : config.sys.urls.submit_verify;
  var opts = makeOpts(url.replace('$id', id));

  request(opts, function(e, resp, body) {
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    var result = JSON.parse(body);
    if (result.status === 'Compiling' || result.status === 'Running')
      return setTimeout(verifyResult, 1000, id, isTest, cb);

    return cb(null, formatResult(result));
  });
}

function formatResult(result) {
  spin.stop();
  var x = {
    ok:              result.status === 'Accepted',
    type:            'Actual',
    state:           result.status,
    runtime:         result.time_cost + ' ms',
    answer:          _strip(result.output),
    stdout:          _strip(result.stdout),
    expected_answer: _strip(result.expected),
    testcase:        _strip(result.input),
    passed:          result.data_accepted_count || 0,
    total:           result.data_total_count || 0
  };

  var error = [];
  if (result.compile_info.length > 0)
    error = error.concat(_split(result.compile_info, '<br>'));
  if (result.error_message.length > 0)
    error = error.concat(_split(result.error_message, '<br>'));
  x.error = error;

  // make sure everything is ok
  if (error.length > 0) x.ok = false;
  if (x.passed !== x.total) x.ok = false;

  return x;
}

plugin.testProblem = function(problem, cb) {
  log.debug('running lintcode.testProblem');
  runCode(problem, true, function(e, result) {
    if (e) return cb(e);

    const expected = {
      ok:     true,
      type:   'Expected',
      answer: result.expected_answer,
      stdout: "''"
    };
    return cb(null, [result, expected]);
  });
};

plugin.submitProblem = function(problem, cb) {
  log.debug('running lintcode.submitProblem');
  runCode(problem, false, function(e, result) {
    if (e) return cb(e);
    return cb(null, [result]);
  });
};

plugin.getSubmissions = function(problem, cb) {
  return cb('Not implemented');
};

plugin.getSubmission = function(submission, cb) {
  return cb('Not implemented');
};

plugin.starProblem = function(problem, starred, cb) {
  return cb('Not implemented');
};

plugin.login = function(user, cb) {
  log.debug('running lintcode.login');
  const opts = {
    url:     config.sys.urls.login,
    headers: {
      'x-csrftoken': null
    },
    form: {
      username_or_email: user.login,
      password:          user.pass
    }
  };

  const spin = h.spin('Signing in lintcode.com');
  request.post(opts, function(e, resp, body) {
    spin.stop();
    if (e) return cb(e);
    if (resp.statusCode !== 200) return cb('invalid password?');

    user.sessionCSRF = h.getSetCookieValue(resp, 'csrftoken');
    user.sessionId = h.getSetCookieValue(resp, 'sessionid');
    user.name = user.login; // FIXME

    return cb(null, user);
  });
};

module.exports = plugin;
