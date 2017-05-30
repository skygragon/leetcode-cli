var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;
var _ = require('underscore');

var chalk = require('../chalk');
var core = require('../core');

var cmd = {
  command: 'stat',
  desc:    'show statistics',
  builder: {
    graph: {
      alias:    'g',
      type:     'boolean',
      default:  false,
      describe: 'Show graphic statistics'
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
  done = done || 0;
  var n = 30;
  var x = Math.ceil(n * done / all);
  return sprintf(' %-8s %3d/%-3d (%.2f%%)\t%s%s',
      key, done, all, done * 100 / all,
      chalk.green(bar('█', x)),
      chalk.red(bar('░', n - x)));
}

function showSummary(problems) {
  var stats = {};
  var statsNoLock = {};

  problems.forEach(function(problem) {
    var keyAll = 'all' + problem.level;
    var keyAC = problem.state + problem.level;
    stats[keyAll] = (stats[keyAll] || 0) + 1;
    stats[keyAC] = (stats[keyAC] || 0) + 1;

    if (!problem.locked) {
      statsNoLock[keyAll] = (statsNoLock[keyAll] || 0) + 1;
      statsNoLock[keyAC] = (statsNoLock[keyAC] || 0) + 1;
    }
  });

  log.info(prettyLine('Easy', stats.acEasy, stats.allEasy));
  log.info(prettyLine('Medium', stats.acMedium, stats.allMedium));
  log.info(prettyLine('Hard', stats.acHard, stats.allHard));

  log.info();
  log.info('Without Locked:');
  log.info(prettyLine('Easy', statsNoLock.acEasy, statsNoLock.allEasy));
  log.info(prettyLine('Medium', statsNoLock.acMedium, statsNoLock.allMedium));
  log.info(prettyLine('Hard', statsNoLock.acHard, statsNoLock.allHard));
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
  for (var i = 1, n = graph.length; i < n; ++i) {
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
  core.getProblems(function(e, problems) {
    if (e) return log.fail(e);

    if (argv.graph) {
      showGraph(problems);
    } else {
      showSummary(problems);
    }
  });
};

module.exports = cmd;
