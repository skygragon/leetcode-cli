var chalk = require('chalk');
var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;

var cmd = {
  command: 'version',
  desc:    'show version info',
  builder: {
  }
};

cmd.handler = function(argv) {
  var appVersion = require('../../package.json').version;
  if (log.getLevel() >= log.levels.INFO) {
    return log.info(appVersion);
  }

  var gitVersion = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
  var version = sprintf('%s (%s)', chalk.green(appVersion), chalk.yellow(gitVersion));

  var logo = [
    ' _           _                  _      ',
    '| |         | |                | |     ',
    '| | ___  ___| |_  ___  ___   __| | ___ ',
    '| |/ _ \\/ _ \\ __|/ __|/ _ \\ / _` |/ _ \\',
    '| |  __/  __/ |_  (__| (_) | (_| |  __/',
    '|_|\\___|\\___|\\__|\\___|\\___/ \\__,_|\\___|  CLI ' + version
  ].join('\n');
  log.debug(logo);

  var h = require('../helper');
  log.debug('\n[Environment]');
  log.debug('Cache: ', h.getCacheDir());
  log.debug('Config:', h.getConfigFile());

  var config = require('../config');
  log.debug('\n[Configuration]');
  Object.getOwnPropertyNames(config).sort().forEach(function(k) {
    log.debug(sprintf('%-16s %s', k + ':', config[k]));
  });
};

module.exports = cmd;
