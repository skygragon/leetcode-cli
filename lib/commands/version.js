var log = require('loglevel');

var cmd = {
  command: 'version',
  desc:    'show version info',
  builder: {
  }
};

cmd.handler = function(argv) {
  var version = require('../../package.json').version;
  if (log.getLevel() >= log.levels.INFO) {
    return log.info(version);
  }

  var logo = [
    ' _           _                  _      ',
    '| |         | |                | |     ',
    '| | ___  ___| |_  ___  ___   __| | ___ ',
    '| |/ _ \\/ _ \\ __|/ __|/ _ \\ / _` |/ _ \\',
    '| |  __/  __/ |_  (__| (_) | (_| |  __/',
    '|_|\\___|\\___|\\__|\\___|\\___/ \\__,_|\\___|  CLI v' + version
  ].join('\n');
  log.info(logo);

  var h = require('../helper');
  log.info('\n[Environment]');
  log.info('Cache: ', h.getCacheDir());
  log.info('Config:', h.getConfigFile());

  var config = require('../config');
  var sprintf = require('sprintf-js').sprintf;
  log.info('\n[Configuration]');
  Object.getOwnPropertyNames(config).sort().forEach(function(k) {
    log.info(sprintf('%-16s %s', k + ':', config[k]));
  });
};

module.exports = cmd;
