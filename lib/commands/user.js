var prompt = require('prompt');

var core = require('../core');

var cmd = {
  command: 'user [--login|-l] [--logout|-L]',
  desc:    'Login/logout with leetcode account.',
  builder: {
    login: {
      alias:    'l',
      describe: 'Login leetcode.'
    },
    logout: {
      alias:    'L',
      describe: 'Logout leetcode.'
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
      if (e) return console.log('Login failed:', e);

      core.login(user, function(e, user) {
        if (e) return console.log('Login failed:', e);

        console.log('Successfully login as', user.name);
      });
    });
  } else if (argv.logout) {
    // logout
    user = core.logout(null);
    if (user)
      console.log('Successfully logout as', user.name);
    else
      console.log('You are not login yet?');
  } else {
    // show current user
    user = core.getUser();
    if (user)
      console.log('You are now login as', user.name);
    else
      console.log('You are not login yet?');
  }
};

module.exports = cmd;
