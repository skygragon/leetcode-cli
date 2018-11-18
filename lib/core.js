'use strict';
var util = require('util');

var _ = require('underscore');

var log = require('./log');
var h = require('./helper');
var file = require('./file');
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
  return Array.isArray(o) && o.some(x => x.indexOf(tag.toLowerCase()) >= 0);
}

const isLevel = (x, q) => x.level[0].toLowerCase() === q.toLowerCase();
const isACed = x => x.state === 'ac';
const isLocked = x => x.locked;
const isStarred = x => x.starred;

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

    for (let q of (opts.query || '').split('')) {
      const f = QUERY_HANDLERS[q];
      if (!f) continue;
      problems = problems.filter(x => f(x, q));
    }

    for (let t of (opts.tag || [])) {
      problems = problems.filter(function(x) {
        return x.category === t ||
          hasTag(x.companies, t) ||
          hasTag(x.tags, t);
      });
    }

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
      return x.fid === keyword || x.name === keyword || x.slug === keyword;
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
  const data = _.extend({}, problem);

  // unify format before rendering
  data.app = require('./config').app;
  if (!data.fid) data.fid = data.id;
  if (!data.lang) data.lang = opts.lang;
  data.code = (opts.code || data.code || '').replace(/\r\n/g, '\n');
  data.comment = h.langToCommentStyle(data.lang);
  data.percent = data.percent.toFixed(2);
  data.testcase = util.inspect(data.testcase || '');

  if (opts.tpl === 'detailed') {
    // NOTE: wordwrap internally uses '\n' as EOL, so here we have to
    // remove all '\r' in the raw string.
    const desc = data.desc.replace(/\r\n/g, '\n').replace(/^ /mg, '⁠');
    const wrap = require('wordwrap')(79 - data.comment.line.length);
    data.desc = wrap(desc).split('\n');
  }

  return file.render(opts.tpl, data);
};

module.exports = core;
