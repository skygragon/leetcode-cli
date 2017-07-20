var fs = require('fs');
var path = require('path');
var util = require('util');

var _ = require('underscore');

var log = require('./log');
var cache = require('./cache');
var config = require('./config');
var client = require('./leetcode_client');
var queue = require('./queue');
var h = require('./helper');

var KEY_USER = '.user';
var KEY_PROBLEMS = 'problems';

function getkey(problem) {
  return problem.id + '.' + problem.slug + '.' + problem.category;
}

function saveProblem(problem) {
  // it would be better to leave specific problem cache being user
  // independent, thus try to reuse existing cache as much as possible
  // after changing user.
  var p = _.omit(problem, ['locked', 'state', 'starred']);
  return cache.set(getkey(p), p);
}

function saveUser(user) {
  // when auto login enabled, have to save password to re-login later
  // otherwise don't dump password for the sake of security.
  var u = _.omit(user, config.AUTO_LOGIN ? [] : ['pass']);
  cache.set(KEY_USER, u);
}

var core = {};

core.getProblems = function(cb) {
  var problems = cache.get(KEY_PROBLEMS);
  if (problems) {
    log.debug('loading from problems.json');
    return cb(null, problems);
  }

  var user = this.getUser();
  var KEY_TMP = '.tmp';

  var doTask = function(category, taskDone) {
    log.debug(category + ': running getProblems');
    client.getProblems(category, user, function(e, problems) {
      if (e) {
        log.debug(category + ': failed to getProblems: ' + e.msg);
      } else {
        log.debug(category + ': getProblems got ' +
            problems.length + ' problems');
        problems = cache.get(KEY_TMP).concat(problems);
        cache.set(KEY_TMP, problems);
      }
      return taskDone(e);
    });
  };

  cache.set(KEY_TMP, []);
  queue.run(config.CATEGORIES, doTask, function(e) {
    if (e) return cb(e);

    saveUser(user);
    var problems = cache.get(KEY_TMP);
    cache.set(KEY_PROBLEMS, problems);
    cache.del(KEY_TMP);

    return cb(null, problems);
  });
};

core.getProblem = function(keyword, cb) {
  this.getProblems(function(e, problems) {
    if (e) return cb(e);

    keyword = Number(keyword) || keyword;

    var problem;
    if (keyword === undefined) {
      log.debug('random select problem');
      var user = core.getUser();
      // random select one that not AC-ed yet
      problems = _.filter(problems, function(x) {
        if (x.state === 'ac') return false;
        if (!user.paid && x.locked) return false;
        return true;
      });
      problem = problems[_.random(problems.length - 1)];
    } else {
      problem = _.find(problems, function(x) {
        return x.id === keyword ||
               x.name === keyword ||
               x.slug === keyword;
      });
    }

    if (!problem)
      return cb('Problem not found!');

    var cachekey = getkey(problem);
    var problemDetail = cache.get(cachekey);
    if (problemDetail) {
      log.debug('loading from ' + cachekey + '.json');
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
  var problems = cache.get(KEY_PROBLEMS);
  if (!problems) return false;

  var oldProblem = _.find(problems, function(x) {
    return x.id === problem.id;
  });
  if (!oldProblem) return false;

  _.extend(oldProblem, kv);
  _.extend(problem, kv);

  var singleUpdated = saveProblem(problem);
  var allUpdated = cache.set(KEY_PROBLEMS, problems);
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
  problem.code = problem.code.replace(/\r\n/g, '\n');

  if (codeOnly) {
    output = problem.code;
  } else {
    var input = {
      comment: h.langToCommentStyle(h.extToLang(f))
    };
    // copy problem attrs thus we can render it in template
    _.extend(input, problem);
    input.percent = input.percent.toFixed(2);
    input.testcase = util.inspect(input.testcase || '');

    // NOTE: wordwrap internally uses '\n' as EOL, so here we have to
    // remove all '\r' in the raw string.
    var desc = input.desc.replace(/\r\n/g, '\n')
                         .replace(/^ /mg, '⁠');

    var wrap = require('wordwrap')(79 - input.comment.line.length);
    input.desc = wrap(desc).split('\n');

    var tpl = fs.readFileSync(path.resolve(__dirname, '../source.tpl'), 'utf-8');
    output = _.template(tpl)(input);
  }

  if (h.isWindows()) {
    output = output.replace(/\n/g, '\r\n');
  } else {
    output = output.replace(/\r\n/g, '\n');
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
  if (purge) cache.del(KEY_USER);
  // NOTE: need invalidate any user related cache
  cache.del(KEY_PROBLEMS);
  return user;
};

core.getUser = function() {
  return cache.get(KEY_USER);
};

core.isLogin = function() {
  return this.getUser() !== null;
};

module.exports = core;
