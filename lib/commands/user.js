var prompt = require('prompt'),
    util = require('util');

var core = require('../core');

var cmd = {
  command: 'user [--login|-l] [--logout|-L]',
  desc: 'Login/logout with leetcode account.',
  builder: {
    login: {
      alias: 'l',
      describe: 'Login leetcode.'
    },
    logout: {
      alias: 'L',
      describe: 'Logout leetcode.'
    }
  }
};

cmd.handler = function(argv) {
  if (argv.login) {
    // login
    prompt.colors = false;
    prompt.message = '';
    prompt.start();
    prompt.get([
      { name: 'login', required: true },
      { name: 'pass', required: true, hidden: true }
    ], function(e, user){
      if (e) return console.log('Login failed:', e);

      core.login(user, function(e, user){
        if (e) return console.log('Login failed:', e);

        console.log('Successfully login as', user.name);
      });
    });
  } else if (argv.logout) {
    // logout
    core.logout(null, function(e, user){
      if (e) return console.log('Logout failed:', e);

      console.log('Successfully logout as', user.name);
    });
  } else {
    // show current user
    core.getUser(function(e, user){
      if (e) return console.log('ERROR:', e);

      console.log('You are now login as', user.name);
    });
  }
}

module.exports = cmd;
