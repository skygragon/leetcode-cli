'use strict';
var request = require('request');

var config = require('../config');
var h = require('../helper');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

//
// [Usage]
//
// https://github.com/skygragon/leetcode-cli-plugins/blob/master/docs/leetcode.cn.md
//
var plugin = new Plugin(15, 'leetcode.cn', '2018.11.25',
    'Plugin to talk with leetcode-cn APIs.');

plugin.init = function() {
  config.app = 'leetcode.cn';
  config.sys.urls.base              = 'https://leetcode.cn';
  config.sys.urls.login             = 'https://leetcode.cn/accounts/login/';
  config.sys.urls.problems          = 'https://leetcode.cn/api/problems/$category/';
  config.sys.urls.problem           = 'https://leetcode.cn/problems/$slug/description/';
  config.sys.urls.graphql           = 'https://leetcode.cn/graphql';
  config.sys.urls.problem_detail    = 'https://leetcode.cn/graphql';
  config.sys.urls.test              = 'https://leetcode.cn/problems/$slug/interpret_solution/';
  config.sys.urls.session           = 'https://leetcode.cn/session/';
  config.sys.urls.submit            = 'https://leetcode.cn/problems/$slug/submit/';
  config.sys.urls.submissions       = 'https://leetcode.cn/api/submissions/$slug';
  config.sys.urls.submission        = 'https://leetcode.cn/submissions/detail/$id/';
  config.sys.urls.verify            = 'https://leetcode.cn/submissions/detail/$id/check/';
  config.sys.urls.favorites         = 'https://leetcode.cn/list/api/questions';
  config.sys.urls.favorite_delete   = 'https://leetcode.cn/list/api/questions/$hash/$id';
  // third parties
  config.sys.urls.github_login      = 'https://leetcode.cn/accounts/github/login/?next=%2F';
  config.sys.urls.linkedin_login    = 'https://leetcode.cn/accounts/linkedin_oauth2/login/?next=%2F';
  config.sys.urls.leetcode_redirect = 'https://leetcode.cn/';
};

// FIXME: refactor those
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

// overloading getProblems here to make sure everything related 
//   to listing out problems can have a chance to be translated. 
// NOTE: Details of the problem is translated inside leetcode.js
plugin.getProblems = function (needTranslation, cb) {
  plugin.next.getProblems(needTranslation, function(e, problems) {
    if (e) return cb(e);

    if (needTranslation) {
      // only translate titles of the list if user requested
      plugin.getProblemsTitle(function (e, titles) {
        if (e) return cb(e);

        problems.forEach(function (problem) {
          const title = titles[problem.id];
          if (title)
            problem.name = title;
        });

        return cb(null, problems);
      });
    } else {
      return cb(null, problems);
    }
  });
};

plugin.getProblemsTitle = function(cb) {
  log.debug('running leetcode.cn.getProblemNames');

  const opts = makeOpts(config.sys.urls.graphql);
  opts.headers.Origin = config.sys.urls.base;
  opts.headers.Referer = 'https://leetcode.cn/api/problems/algorithms/';

  opts.json = true;
  opts.body = {
    query: [
      'query getQuestionTranslation($lang: String) {',
      '  translations: allAppliedQuestionTranslations(lang: $lang) {',
      '    title',
      '    questionId',
      '    __typename',
      '    }',
      '}'
    ].join('\n'),
    variables:     {},
    operationName: 'getQuestionTranslation'
  };

  const spin = h.spin('Downloading questions titles');
  request.post(opts, function(e, resp, body) {
    spin.stop();
    e = checkError(e, resp, 200);
    if (e) return cb(e);

    const titles = [];
    body.data.translations.forEach(function(x) {
      titles[x.questionId] = x.title;
    });

    return cb(null, titles);
  });
};

module.exports = plugin;
