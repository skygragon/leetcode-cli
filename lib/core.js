var _ = require('underscore');

var cache = require('./cache'),
    client = require('./leetcode_client');

var core = {};

core.getProblems = function(cb) {
  var cached = cache.get('all');
  if (cached) return cb(null, cached);

  client.getProblems(function(e, problems){
    cache.set('all', problems);
    return cb(e, problems);
  });
};

core.getProblem = function(keyword, cb) {
  this.getProblems(function(e, problems) {
    if (e) return cb(e);

    var problem = _.find(problems, function(x){
      return x.id == keyword || x.name == keyword || x.key == keyword;
    });
    if (!problem)
      return cb('Problem not found!');

    var cached = cache.get(problem.key);
    if (cached) return cb(null, cached);

    client.getProblem(problem, function(e, problem){
      cache.set(problem.key, problem);
      return cb(null, problem);
    });
  });
};

module.exports = core;
