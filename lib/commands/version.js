var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

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
  session.argv = argv;
  var version = getVersion();

  if (!log.isEnabled('DEBUG'))
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
  _.each(config.getUserConfig(), function(v, k) {
    prettyLine(k, v);
  });

  log.info('\n[Themes]');
  prettyLine('Colors', _.keys(chalk.themes));
  prettyLine('Icons', _.keys(icon.themes));

  log.info('\n[Plugins]');
  _.each(Plugin.plugins, function(p, k) {
    prettyLine(p.name, p.ver);
  });
};

module.exports = cmd;
