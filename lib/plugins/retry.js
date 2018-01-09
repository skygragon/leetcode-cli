'use strict';
var config = require('../config');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

var plugin = new Plugin(30, 'retry', '',
    'Plugin to retry last failed request if autologin.enable is on.');

const count = {};

function canRetry(e, name) {
  return config.autologin.enable &&
    (e === session.errors.EXPIRED) &&
    (count[name] || 0) < config.autologin.retry;
}

plugin.init = function() {
  const names = [
    'activateSession',
    'createSession',
    'deleteSession',
    'getProblems',
    'getProblem',
    'getSessions',
    'getSubmissions',
    'getSubmission',
    'getFavorites',
    'testProblem',
    'submitProblem',
    'starProblem'
  ];

  for (let name of names) {
    count[name] = 0;
    plugin[name] = function() {
      const args = Array.from(arguments);
      const cb = args.pop();

      const _cb = function() {
        const results = Array.from(arguments);
        const e = results[0];
        if (!canRetry(e, name)) {
          count[name] = 0;
          return cb.apply(null, results);
        }

        ++count[name];
        plugin.relogin(function() {
          // for now we don't care result, just blindly retry
          plugin[name].apply(plugin, args.concat(cb));
        });
      };

      const next = plugin.next;
      next[name].apply(next, args.concat(_cb));
    };
  }
};

// leetcode.com is limiting one session alive in the same time,
// which means once you login on web, your cli session will get
// expired immediately. In that case we will try to re-login in
// the backend to give a seamless user experience.
plugin.relogin = function(cb) {
  log.debug('session expired, try to re-login...');

  const user = session.getUser();
  if (!user) {
    log.debug('relogin failed: no user found, please login again');
    return cb();
  }

  this.login(user, function(e) {
    if (e) {
      log.debug('login failed:' + e.msg);
    } else {
      log.debug('login successfully, cont\'d...');
    }
    return cb();
  });
};

module.exports = plugin;
