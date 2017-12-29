var _ = require('underscore');

var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

var cmd = {
  command: 'version',
  aliases: ['info', 'env'],
  desc:    'Show version info',
  builder: {
  }
};

function printLine(k, v) {
  log.printf('%-20s %s', k, v);
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
  printLine('Node', process.version);
  printLine('OS', os.platform() + ' ' + os.release());
  printLine('Cache', h.getCacheDir());
  printLine('Config', h.getConfigFile());

  log.info('\n[Configuration]');
  _.each(config.getAll(true), function(v, k) {
    if (k === 'plugins') return;
    printLine(k, JSON.stringify(v));
  });

  log.info('\n[Themes]');
  printLine('Colors', _.keys(chalk.themes));
  printLine('Icons', _.keys(icon.themes));

  log.info('\n[Plugins]');
  _.each(Plugin.plugins, function(p, k) {
    printLine(p.name, p.ver);
  });
};

module.exports = cmd;
