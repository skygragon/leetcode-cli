var chalk = require('chalk');
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
      describe: 'Login'
    },
    logout: {
      alias:    'L',
      type:     'boolean',
      describe: 'Logout'
    },
    stat: {
      alias:    's',
      type:     'boolean',
      describe: 'Show user statistics'
    }
  }
};

function bar(c, n) {
  return new Buffer(n).fill(c).toString();
}

function prettyLine(key, done, all) {
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
      if (e) return console.log('Login failed:', e);

      core.login(user, function(e, user) {
        if (e) return console.log('Login failed:', e);

        console.log('Successfully login as', chalk.yellow(user.name));
      });
    });
  } else if (argv.logout) {
    // logout
    user = core.logout(null);
    if (user)
      console.log('Successfully logout as', chalk.yellow(user.name));
    else
      console.log('You are not login yet?');
  } else {
    // show current user
    user = core.getUser();
    if (user)
      console.log('You are now login as', chalk.yellow(user.name));
    else
      return console.log('You are not login yet?');

    if (argv.stat) {
      core.getProblems(function(e, problems) {
        if (e) return console.log('Get stats failed:', e);

        var stats = {};
        problems.forEach(function(problem) {
          var keyAll = 'all' + problem.level;
          var keyAC = problem.state + problem.level;
          stats[keyAll] = (stats[keyAll] || 0) + 1;
          stats[keyAC] = (stats[keyAC] || 0) + 1;
        });

        console.log();
        console.log(prettyLine('Easy', stats.acEasy, stats.allEasy));
        console.log(prettyLine('Medium', stats.acMedium, stats.allMedium));
        console.log(prettyLine('Hard', stats.acHard, stats.allHard));
      });
    }
  }
};

module.exports = cmd;
