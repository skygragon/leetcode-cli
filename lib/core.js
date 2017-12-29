var path = require('path');
var util = require('util');

var _ = require('underscore');

var log = require('./log');
var h = require('./helper');
var Plugin = require('./plugin');
var session = require('./session');

var core = new Plugin(99999999, 'core', '20170722', 'Plugins manager');

core.getProblem = function(keyword, cb) {
  this.getProblems(function(e, problems) {
    if (e) return cb(e);

    var problem;
    keyword = Number(keyword) || keyword;

    if (keyword === '') {
      var user = session.getUser();
      // random select one that not AC-ed yet
      problems = _.filter(problems, function(x) {
        if (x.state === 'ac') return false;
        if (!user.paid && x.locked) return false;
        return true;
      });
      if (problems.length > 0)
        problem = problems[_.random(problems.length - 1)];
    } else {
      problem = _.find(problems, function(x) {
        return x.id === keyword || x.name === keyword || x.slug === keyword;
      });
    }

    if (!problem) return cb('Problem not found!');
    core.next.getProblem(problem, cb);
  });
};

core.starProblem = function(problem, starred, cb) {
  if (problem.starred === starred) {
    log.debug('problem is already ' + (starred ? 'starred' : 'unstarred'));
    return cb(null, starred);
  }

  core.next.starProblem(problem, starred, cb);
};

core.exportProblem = function(problem, opts) {
  // copy problem attrs thus we can render it in template
  var input = _.extend({}, problem);

  input.code = opts.code.replace(/\r\n/g, '\n');
  input.comment = h.langToCommentStyle(opts.lang);
  input.percent = input.percent.toFixed(2);
  input.testcase = util.inspect(input.testcase || '');

  if (opts.tpl === 'detailed') {
    // NOTE: wordwrap internally uses '\n' as EOL, so here we have to
    // remove all '\r' in the raw string.
    var desc = input.desc.replace(/\r\n/g, '\n').replace(/^ /mg, '⁠');
    var wrap = require('wordwrap')(79 - input.comment.line.length);
    input.desc = wrap(desc).split('\n');
  }

  var tplfile = path.join(h.getCodeDir('templates'), opts.tpl + '.tpl');
  var output = _.template(h.getFileData(tplfile))(input);

  if (h.isWindows()) {
    output = output.replace(/\n/g, '\r\n');
  } else {
    output = output.replace(/\r\n/g, '\n');
  }
  return output;
};

module.exports = core;
