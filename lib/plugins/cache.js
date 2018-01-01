'use strict';
var _ = require('underscore');

var cache = require('../cache');
var h = require('../helper');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

var plugin = new Plugin(50, 'cache', '', 'Plugin to provide local cache.');

plugin.init = function() {
  Plugin.prototype.init.call(this);
  cache.init();
};

plugin.getProblems = function(cb) {
  var problems = cache.get(h.KEYS.problems);
  if (problems) {
    log.debug('cache hit: problems.json');
    return cb(null, problems);
  }

  plugin.next.getProblems(function(e, problems) {
    if (e) return cb(e);

    cache.set(h.KEYS.problems, problems);
    return cb(null, problems);
  });
};

plugin.getProblem = function(problem, cb) {
  var k = h.KEYS.problem(problem);
  var _problem = cache.get(k);
  if (_problem) {
    log.debug('cache hit: ' + k + '.json');
    _.extendOwn(problem, _problem);
    return cb(null, problem);
  }

  plugin.next.getProblem(problem, function(e, _problem) {
    if (e) return cb(e);

    plugin.saveProblem(_problem);
    return cb(null, _problem);
  });
};

plugin.saveProblem = function(problem) {
  // it would be better to leave specific problem cache being user
  // independent, thus try to reuse existing cache as much as possible
  // after changing user.
  var _problem = _.omit(problem, ['locked', 'state', 'starred']);
  return cache.set(h.KEYS.problem(problem), _problem);
};

plugin.updateProblem = function(problem, kv) {
  var problems = cache.get(h.KEYS.problems);
  if (!problems) return false;

  var _problem = problems.find(function(x) { return x.id === problem.id; });
  if (!_problem) return false;

  _.extend(_problem, kv);
  return cache.set(h.KEYS.problems, problems);
};

plugin.login = function(user, cb) {
  this.logout(user, false);
  plugin.next.login(user, function(e, user) {
    if (e) return cb(e);
    session.saveUser(user);
    return cb(null, user);
  });
};

plugin.logout = function(user, purge) {
  if (!user) user = session.getUser();
  if (purge) session.deleteUser();
  // NOTE: need invalidate any user related cache
  cache.del(h.KEYS.problems);
  return user;
};

module.exports = plugin;
