var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;

var cmd = {
  command: 'version',
  desc:    'show version info',
  builder: {
  }
};

function prettyLine(k, v) {
  log.info(sprintf('%-20s %s', k, v));
}

function getVersion() {
  var version = require('../../package.json').version;

  try {
    var commit = require('../../.env.json').commit.short;
    if (commit) version += '-' + commit;
  } catch (e) {}

  return version;
}

cmd.handler = function(argv) {
  var version = getVersion();

  if (log.getLevel() >= log.levels.INFO)
    return log.info(version);

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
  var os = require('os');
  var config = require('../config');

  log.info('\n[Environment]');
  prettyLine('Node', process.version);
  prettyLine('OS', os.platform() + ' ' + os.release());
  prettyLine('Cache', h.getCacheDir());
  prettyLine('Config', h.getConfigFile());

  log.info('\n[Configuration]');
  Object.getOwnPropertyNames(config).sort().forEach(function(k) {
    prettyLine(k, config[k]);
  });
};

module.exports = cmd;
