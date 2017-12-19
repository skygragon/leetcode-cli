var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var h = require('../helper');
var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var core = require('../core');
var session = require('../session');

var cmd = {
  command: 'list [keyword]',
  desc:    'list problems',
  builder: {
    keyword: {
      type:     'string',
      default:  '',
      describe: 'Filter problems by keyword'
    },
    query: {
      alias:    'q',
      type:     'string',
      default:  '',
      describe: 'Filter problems by conditions:\n' +
                'e(easy),m(medium),h(hard),d(done),l(locked),s(starred)\n' +
                'Uppercase means negative, e.g. D(not done)'
    },
    stat: {
      alias:    's',
      type:     'boolean',
      default:  false,
      describe: 'Show problems statistics'
    },
    tags: {
      alias:    't',
      type:     'array',
      default:  [],
      describe: 'Filter problems by tags'
    }
  }
};

function byLevel(x, q) {
  return x.level[0].toLowerCase() === q.toLowerCase();
}

function byStateAC(x, q) {
  return x.state === 'ac';
}

function byLocked(x, q) {
  return x.locked;
}

function byStarred(x, q) {
  return x.starred;
}

var QUERY_HANDLERS = {
  e: byLevel,
  E: _.negate(byLevel),
  m: byLevel,
  M: _.negate(byLevel),
  h: byLevel,
  H: _.negate(byLevel),
  l: byLocked,
  L: _.negate(byLocked),
  d: byStateAC,
  D: _.negate(byStateAC),
  s: byStarred,
  S: _.negate(byStarred)
};

function hasTag(o, tag) {
  return _.isArray(o) && _.some(o, function(x) {
    return x.indexOf(tag.toLowerCase()) !== -1;
  });
}

cmd.handler = function(argv) {
  session.argv = argv;
  core.getProblems(function(e, problems) {
    if (e) return log.fail(e);

    var all = problems.length;

    if (argv.query) {
      argv.query.split('').forEach(function(q) {
        var f = QUERY_HANDLERS[q];
        if (!f) return;

        problems = _.filter(problems, _.partial(f, _, q));
      });
    }

    argv.tags.forEach(function(tag) {
      // TODO: fill company/tags in problems
      problems = _.filter(problems, function(p) {
        return p.category === tag ||
          hasTag(p.companies, tag) ||
          hasTag(p.tags, tag);
      });
    });

    var word = String(argv.keyword).toLowerCase();
    if (word) {
      if (word.endsWith(word.substr(-1).repeat(6))) {
        log.warn('Hmmm...you might need a new keyboard?');
      }
      problems = _.filter(problems, function(x) {
        return x.name.toLowerCase().indexOf(word) !== -1;
      });
    }

    var stat = {};
    ['locked', 'starred', 'ac', 'notac', 'None', 'Easy', 'Medium', 'Hard'].forEach(function(x) {
      stat[x] = 0;
    });

    problems = _.sortBy(problems, function(x) {
      return -x.id;
    });

    problems.forEach(function(problem) {
      stat[problem.level] = (stat[problem.level] || 0) + 1;
      stat[problem.state] = (stat[problem.state] || 0) + 1;
      if (problem.locked) ++stat.locked;
      if (problem.starred) ++stat.starred;

      log.printf('%s %s %s [%3d] %-60s %-6s (%.2f %%)',
          (problem.starred ? chalk.yellow(icon.like) : icon.none),
          (problem.locked ? chalk.red(icon.lock) : icon.none),
          h.prettyState(problem.state),
          problem.id,
          problem.name,
          h.prettyLevel(sprintf('%-6s', problem.level)),
          problem.percent);
    });

    if (argv.stat) {
      log.info();
      log.printf('      All:    %-9d Listed:  %-9d', all, problems.length);
      log.printf('      Locked: %-9d Starred: %-9d', stat.locked, stat.starred);
      log.printf('      Accept: %-9d Not-AC:  %-9d New:  %-9d', stat.ac, stat.notac, stat.None);
      log.printf('      Easy:   %-9d Medium:  %-9d Hard: %-9d', stat.Easy, stat.Medium, stat.Hard);
    }
  });
};

module.exports = cmd;
