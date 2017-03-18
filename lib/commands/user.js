var chalk = require('chalk');
var log = require('loglevel');
var prompt = require('prompt');
var sprintf = require('sprintf-js').sprintf;

var core = require('../core');

var cmd = {
  command: 'user',
  desc:    'login/logout with leetcode account',
  builder: {
    login: {
      alias:    'l',
      type:     'boolean',
      default:  false,
      describe: 'Login'
    },
    logout: {
      alias:    'L',
      type:     'boolean',
      default:  false,
      describe: 'Logout'
    },
    stat: {
      alias:    's',
      type:     'boolean',
      default:  false,
      describe: 'Show user statistics'
    }
  }
};

function bar(c, n) {
  return new Buffer(n).fill(c).toString();
}

function prettyLine(key, done, all) {
  done = done || 0;
  var n = 30;
  var x = Math.ceil(n * done / all);
  return sprintf('%-8s %3d/%-3d (%.2f%%)\t%s%s',
      key, done, all, done * 100 / all,
      chalk.green('[' + bar(chalk.enabled ? '.' : '+', x)),
      chalk.red(bar('.', n - x) + ']'));
}

cmd.handler = function(argv) {
  var user = null;
  if (argv.login) {
    // login
    prompt.colors = false;
    prompt.message = '';
    prompt.start();
    prompt.get([
      {name: 'login', required: true},
      {name: 'pass', required: true, hidden: true}
    ], function(e, user) {
      if (e) return log.fail(e);

      core.login(user, function(e, user) {
        if (e) return log.fail(e);

        log.info('Successfully login as', chalk.yellow(user.name));
      });
    });
  } else if (argv.logout) {
    // logout
    user = core.logout(null);
    if (user)
      log.info('Successfully logout as', chalk.yellow(user.name));
    else
      log.fail('You are not login yet?');
  } else {
    // show current user
    user = core.getUser();
    if (user)
      log.info('You are now login as', chalk.yellow(user.name));
    else
      return log.fail('You are not login yet?');

    if (argv.stat) {
      core.getProblems(function(e, problems) {
        if (e) return log.fail(e);

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

        log.info();
        log.info(prettyLine('Easy', stats.acEasy, stats.allEasy));
        log.info(prettyLine('Medium', stats.acMedium, stats.allMedium));
        log.info(prettyLine('Hard', stats.acHard, stats.allHard));

        log.info();
        log.info('Without Locked:');
        log.info(prettyLine('Easy', statsNoLock.acEasy, statsNoLock.allEasy));
        log.info(prettyLine('Medium', statsNoLock.acMedium, statsNoLock.allMedium));
        log.info(prettyLine('Hard', statsNoLock.acHard, statsNoLock.allHard));
      });
    }
  }
};

module.exports = cmd;
