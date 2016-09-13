var cmd = {
  command: 'version',
  desc:    'show version info',
  builder: {
    verbose: {
      alias:    'v',
      type:     'boolean',
      describe: 'More verbose info'
    }
  }
};

cmd.handler = function(argv) {
  var version = require('../../package.json').version;

  if (!argv.verbose) {
    return console.log(version);
  }

  var logo = [
    ' _           _                  _      ',
    '| |         | |                | |     ',
    '| | ___  ___| |_  ___  ___   __| | ___ ',
    '| |/ _ \\/ _ \\ __|/ __|/ _ \\ / _` |/ _ \\',
    '| |  __/  __/ |_  (__| (_) | (_| |  __/',
    '|_|\\___|\\___|\\__|\\___|\\___/ \\__,_|\\___|  CLI v' + version
  ].join('\n');
  console.log(logo);

  var h = require('../helper');
  console.log();
  console.log('Cache:', h.getCacheDir());
  console.log('Config:', h.getConfigFile());

  var config = require('../config');
  console.log();
  Object.getOwnPropertyNames(config).forEach(function(k) {
    console.log(k, '=', config[k]);
  });
};

module.exports = cmd;
