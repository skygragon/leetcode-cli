'use strict';
var path = require('path');
var util = require('util');

var _ = require('underscore');

var log = require('./log');
var h = require('./helper');
var Plugin = require('./plugin');

const core = new Plugin(99999999, 'core', '20170722', 'Plugins manager');

core.filters = {
  query: {
    alias:    'query',
    type:     'string',
    default:  '',
    describe: [
      'Filter questions by condition:',
      'Uppercase means negative',
      'e = easy     E = m+h',
      'm = medium   M = e+h',
      'h = hard     H = e+m',
      'd = done     D = not done',
      'l = locked   L = non locked',
      's = starred  S = not starred'
    ].join('\n')
  },
  tag: {
    alias:    'tag',
    type:     'array',
    default:  [],
    describe: 'Filter questions by tag'
  }
};

function hasTag(o, tag) {
  return Array.isArray(o) &&
    o.some(function(x) { return x.indexOf(tag.toLowerCase()) >= 0; });
}

function isLevel(x, q) { return x.level[0].toLowerCase() === q.toLowerCase(); }
function isACed(x) { return x.state === 'ac'; }
function isLocked(x) { return x.locked; }
function isStarred(x) { return x.starred; }

const QUERY_HANDLERS = {
  e: isLevel,
  E: _.negate(isLevel),
  m: isLevel,
  M: _.negate(isLevel),
  h: isLevel,
  H: _.negate(isLevel),
  l: isLocked,
  L: _.negate(isLocked),
  d: isACed,
  D: _.negate(isACed),
  s: isStarred,
  S: _.negate(isStarred)
};

core.filterProblems = function(opts, cb) {
  this.getProblems(function(e, problems) {
    if (e) return cb(e);

    (opts.query || '').split('').forEach(function(q) {
      const f = QUERY_HANDLERS[q];
      if (!f) return;
      problems = problems.filter(function(x) { return f(x, q); });
    });

    (opts.tag || []).forEach(function(t) {
      problems = problems.filter(function(x) {
        return x.category === t ||
          hasTag(x.companies, t) ||
          hasTag(x.tags, t);
      });
    });

    return cb(null, problems);
  });
};

core.getProblem = function(keyword, cb) {
  if (keyword.id)
    return core.next.getProblem(keyword, cb);

  this.getProblems(function(e, problems) {
    if (e) return cb(e);

    keyword = Number(keyword) || keyword;
    const problem = problems.find(function(x) {
      return x.id === keyword || x.name === keyword || x.slug === keyword;
    });
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
  const input = _.extend({}, problem);

  input.code = opts.code.replace(/\r\n/g, '\n');
  input.comment = h.langToCommentStyle(opts.lang);
  input.percent = input.percent.toFixed(2);
  input.testcase = util.inspect(input.testcase || '');

  if (opts.tpl === 'detailed') {
    // NOTE: wordwrap internally uses '\n' as EOL, so here we have to
    // remove all '\r' in the raw string.
    const desc = input.desc.replace(/\r\n/g, '\n').replace(/^ /mg, '⁠');
    const wrap = require('wordwrap')(79 - input.comment.line.length);
    input.desc = wrap(desc).split('\n');
  }

  const tplfile = path.join(h.getCodeDir('templates'), opts.tpl + '.tpl');
  let output = _.template(h.getFileData(tplfile))(input);

  if (h.isWindows()) {
    output = output.replace(/\n/g, '\r\n');
  } else {
    output = output.replace(/\r\n/g, '\n');
  }
  return output;
};

module.exports = core;
