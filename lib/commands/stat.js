var sprintf = require('sprintf-js').sprintf;
var _ = require('underscore');

var config = require('../config');
var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');

var cmd = {
  command: 'stat',
  desc:    'show statistics',
  builder: {
    graph: {
      alias:    'g',
      type:     'boolean',
      default:  false,
      describe: 'Show graphic statistics'
    },
    tag: {
      alias:    't',
      type:     'string',
      default:  'all',
      describe: 'Show statistics on given tag',
      choices:  ['all'].concat(config.CATEGORIES)
    }
  }
};

function bar(c, n) {
  return _.range(n)
    .map(function(i) {
      return c;
    })
    .join('');
}

function prettyLine(key, done, all) {
  var n = 30;
  var percent = (all > 0) ? done / all : 0;
  var x = Math.ceil(n * percent);
  return sprintf(' %-8s %3d/%-3d (%.2f%%)\t%s%s',
      key, done, all, 100 * percent,
      chalk.green(bar('█', x)),
      chalk.red(bar('░', n - x)));
}

function showSummary(problems) {
  var stats = {
    easy:   {all: 0, ac: 0},
    medium: {all: 0, ac: 0},
    hard:   {all: 0, ac: 0}
  };
  var statsNoLock = {
    easy:   {all: 0, ac: 0},
    medium: {all: 0, ac: 0},
    hard:   {all: 0, ac: 0}
  };

  problems.forEach(function(problem) {
    var level = problem.level.toLowerCase();
    var state = problem.state.toLowerCase();

    if (!(level in stats)) return;
    ++stats[level].all;
    if (!problem.locked) ++statsNoLock[level].all;

    if (!(state in stats[level])) return;
    ++stats[level][state];
    if (!problem.locked) ++statsNoLock[level][state];
  });

  log.info(prettyLine('Easy', stats.easy.ac, stats.easy.all));
  log.info(prettyLine('Medium', stats.medium.ac, stats.medium.all));
  log.info(prettyLine('Hard', stats.hard.ac, stats.hard.all));

  log.info();
  log.info('Without Locked:');
  log.info(prettyLine('Easy', statsNoLock.easy.ac, statsNoLock.easy.all));
  log.info(prettyLine('Medium', statsNoLock.medium.ac, statsNoLock.medium.all));
  log.info(prettyLine('Hard', statsNoLock.hard.ac, statsNoLock.hard.all));
}

function showGraph(problems) {
  var ac = chalk.green('█');
  var notac = chalk.enabled ? chalk.red('█') : 'X';
  var none = chalk.gray('░');

  var graph = [];
  _.each(problems, function(problem) {
    if (problem.state === 'ac') {
      graph[problem.id] = ac;
    } else if (problem.state === 'notac') {
      graph[problem.id] = notac;
    } else {
      graph[problem.id] = none;
    }
  });

  log.info(sprintf('%8d%9d%5d%8d%5d%8d%5d%8d%5d%8d',
        1, 10, 11, 20, 21, 30, 31, 40, 41, 50));

  var line = [sprintf(' %03d   ', 1)];
  for (var i = 1, n = graph.length; i <= n; ++i) {
    line.push(graph[i] || ' ');
    if (i % 10 === 0) line.push('   ');
    if (i % 50 === 0 || i === n) {
      log.info(line.join(''));
      line = [sprintf(' %03d   ', i)];
    }
  }

  log.info();
  log.info(sprintf('%7s%s%3s%s%3s%s',
        ' ', ac + chalk.green(' Accepted'),
        ' ', notac + chalk.red(' Not Accepted'),
        ' ', none + ' Remaining'));
  log.info();
}

cmd.handler = function(argv) {
  session.argv = argv;
  core.getProblems(function(e, problems) {
    if (e) return log.fail(e);

    if (argv.tag !== 'all') {
      problems = _.filter(problems, function(x) {
        return x.category === argv.tag;
      });
    }

    if (argv.graph) {
      showGraph(problems);
    } else {
      showSummary(problems);
    }
  });
};

module.exports = cmd;
