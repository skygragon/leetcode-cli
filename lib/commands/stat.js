var chalk = require('chalk');
var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;

var core = require('../core');

var cmd = {
  command: 'stat',
  desc:    'show statistics',
  builder: {
  }
};

function bar(c, n) {
  return new Buffer(n).fill(c).toString();
}

function prettyLine(key, done, all) {
  done = done || 0;
  var n = 30;
  var x = Math.ceil(n * done / all);
  return sprintf('%-8s %3d/%-3d (%.2f%%)\t%s%s%s',
      key, done, all, done * 100 / all,
      chalk.green('[' + bar(chalk.enabled ? '.' : '+', x)),
      chalk.red(bar('.', n - x)),
      done === all ? chalk.green(']') : chalk.red(']'));
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

cmd.handler = function(argv) {
  core.getProblems(function(e, problems) {
    if (e) return log.fail(e);

    showSummary(problems);
  });
};

module.exports = cmd;
