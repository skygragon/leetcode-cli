'use strict';
var _ = require('underscore');

var cache = require('../cache');
var h = require('../helper');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

const plugin = new Plugin(50, 'cache', '', 'Plugin to provide local cache.');

plugin.getProblems = function(cb) {
  const problems = cache.get(h.KEYS.problems);
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
  const k = h.KEYS.problem(problem);
  const _problem = cache.get(k);
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
  const _problem = _.omit(problem, ['locked', 'state', 'starred']);
  return cache.set(h.KEYS.problem(problem), _problem);
};

plugin.updateProblem = function(problem, kv) {
  const problems = cache.get(h.KEYS.problems);
  if (!problems) return false;

  const _problem = problems.find(x => x.id === problem.id);
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
  session.deleteCodingSession();
  return user;
};

module.exports = plugin;
