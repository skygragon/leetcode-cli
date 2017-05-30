var fs = require('fs');
var path = require('path');
var util = require('util');

var _ = require('underscore');
var log = require('loglevel');

var cache = require('./cache');
var config = require('./config');
var client = require('./leetcode_client');
var h = require('./helper');

function saveProblem(problem) {
  // it would be better to leave specific problem cache being user
  // independent, thus try to reuse existing cache as much as possible
  // after changing user.
  var p = _.omit(problem, ['locked', 'state', 'starred']);
  return cache.set(p.key, p);
}

function saveUser(user) {
  // when auto login enabled, have to save password to re-login later
  // otherwise don't dump password for the sake of security.
  var u = _.omit(user, config.AUTO_LOGIN ? [] : ['pass']);
  cache.set('.user', u);
}

var core = {};

core.getProblems = function(cb) {
  var problems = cache.get('all');
  if (problems) {
    log.debug('loading from all.json');
    return cb(null, problems);
  }

  log.debug('running getProblems');
  var user = this.getUser();
  client.getProblems(user, function(e, problems) {
    if (e) return cb(e);

    saveUser(user);
    cache.set('all', problems);
    return cb(null, problems);
  });
};

core.getProblem = function(keyword, cb) {
  this.getProblems(function(e, problems) {
    if (e) return cb(e);

    keyword = Number(keyword) || keyword;

    var problem = _.find(problems, function(x) {
      return x.id === keyword ||
             x.name === keyword ||
             x.key === keyword;
    });
    if (!problem)
      return cb('Problem not found!');

    var problemDetail = cache.get(problem.key);
    if (problemDetail) {
      log.debug('loading from ' + problem.key + '.json');
      _.extendOwn(problem, problemDetail);
      return cb(null, problem);
    }

    log.debug('running getProblem');
    client.getProblem(core.getUser(), problem, function(e, problem) {
      if (e) return cb(e);

      saveProblem(problem);
      return cb(null, problem);
    });
  });
};

core.getSubmissions = function(problem, cb) {
  log.debug('running getSubmissions');
  client.getSubmissions(problem, cb);
};

core.getSubmission = function(submission, cb) {
  log.debug('running getSubmission');
  client.getSubmission(submission, cb);
};

core.testProblem = function(problem, cb) {
  log.debug('running testProblem');
  client.testProblem(problem, cb);
};

core.submitProblem = function(problem, cb) {
  log.debug('running submitProblem');
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
  _.extend(problem, kv);

  var singleUpdated = saveProblem(problem);
  var allUpdated = cache.set('all', problems);
  return singleUpdated && allUpdated;
};

core.starProblem = function(problem, starred, cb) {
  if (problem.starred === starred) {
    log.debug('problem is already ' + (starred ? 'starred' : 'unstarred'));
    return cb(null, starred);
  }

  log.debug('running starProblem');
  client.starProblem(this.getUser(), problem, starred, cb);
};

core.exportProblem = function(problem, f, codeOnly) {
  var output = '';

  if (codeOnly) {
    output = problem.code;
  } else {
    var input = h.langToCommentStyle(h.extToLang(f));
    // copy problem attrs thus we can render it in template
    _.extend(input, problem);
    input.percent = input.percent.toFixed(2);
    input.testcase = util.inspect(input.testcase || '');

    // NOTE: wordwrap internally uses '\n' as EOL, so here we have to
    // remove all '\r' in the raw string.
    // FIXME: while in template file we still use '\r\n' for the sake
    // of windows, is it really necessary?
    var desc = input.desc.replace(/\r\n/g, '\n')
                         .replace(/^ /mg, '⁠');

    var wrap = require('wordwrap')(79 - input.commentLine.length);
    input.desc = wrap(desc).split('\n');

    var tpl = fs.readFileSync(path.resolve(__dirname, '../source.tpl'), 'utf-8');
    output = _.template(tpl)(input);
  }

  fs.writeFileSync(f, output);
};

core.login = function(user, cb) {
  this.logout(false);
  client.login(user, function(e, user) {
    if (e) return cb(e);

    saveUser(user);
    log.debug('running getFavorites');
    client.getFavorites(function(e, favorites) {
      if (e) return cb(e);

      // TODO: pick other useful values from favorites
      var favorite = _.find(favorites.favorites.private_favorites, function(f) {
        return f.name === 'Favorite';
      });
      user.hash = favorite.id_hash;

      saveUser(user);
      return cb(null, user);
    });
  });
};

core.logout = function(purge) {
  var user = this.getUser();
  if (purge) cache.del('.user');
  // NOTE: need invalidate any user related cache
  cache.del('all');
  return user;
};

core.getUser = function() {
  return cache.get('.user');
};

core.isLogin = function() {
  return this.getUser() !== null;
};

module.exports = core;
