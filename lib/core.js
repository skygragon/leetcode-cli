var _ = require('underscore');

var cache = require('./cache');
var config = require('./config');
var client = require('./leetcode_client');

var core = {};

core.getProblems = function(cb) {
  var cached = cache.get('all');
  if (cached) return cb(null, cached);

  client.getProblems(function(e, problems) {
    if (e) return cb(e);

    cache.set('all', problems);
    return cb(null, problems);
  });
};

core.getProblem = function(keyword, cb) {
  this.getProblems(function(e, problems) {
    if (e) return cb(e);

    var problem = _.find(problems, function(x) {
      return x.id === keyword ||
             x.name === keyword ||
             x.key === keyword;
    });
    if (!problem)
      return cb('Problem not found!');

    var cached = cache.get(problem.key);
    if (cached) return cb(null, cached);

    client.getProblem(problem, function(e, problem) {
      if (e) return cb(e);

      cache.set(problem.key, problem);
      return cb(null, problem);
    });
  });
};

core.getSubmissions = function(problem, cb) {
  client.getSubmissions(problem, cb);
};

core.getSubmission = function(submission, cb) {
  client.getSubmission(submission, cb);
};

core.testProblem = function(problem, cb) {
  client.testProblem(problem, cb);
};

core.submitProblem = function(problem, cb) {
  client.submitProblem(problem, cb);
};

core.updateProblem = function(problem, kv) {
  var problems = cache.get('all');
  if (!problems) return false;

  var oldProblem = _.find(problems, function(x) {
    return x.id === problem.id;
  });
  if (!oldProblem) return false;

  _.extend(oldProblem, kv);
  return cache.set('all', problems);
};

core.starProblem = function(problem, cb) {
  client.starProblem(problem, cb);
};

core.login = function(user, cb) {
  var self = this;
  client.login(user, function(e, user) {
    if (e) return cb(e);

    self.logout();

    if (config.AUTO_LOGIN)
      // need save password thus we can auto re-login later
      cache.set('.user', user);
    else
      cache.set('.user', _.omit(user, 'pass'));

    return cb(null, user);
  });
};

core.logout = function(user) {
  user = this.getUser();
  if (user) {
    // NOTE: need invalidate any user related cache
    cache.del('.user');
    cache.del('all');
  }
  return user;
};

core.getUser = function() {
  return cache.get('.user');
};

core.isLogin = function() {
  return this.getUser() !== null;
};

module.exports = core;
