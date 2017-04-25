var log = require('loglevel');
var prompt = require('prompt');

var chalk = require('../chalk');
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
    }
  }
};

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
  }
};

module.exports = cmd;
