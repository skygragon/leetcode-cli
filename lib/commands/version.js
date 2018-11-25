'use strict';
var _ = require('underscore');

var file = require('../file');
var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

const cmd = {
  command: 'version',
  aliases: ['info', 'env'],
  desc:    'Show version info',
  builder: function(yargs) {
    return yargs
      .example(chalk.yellow('leetcode version'), 'Show version number')
      .example(chalk.yellow('leetcode version -v'), 'Show more details');
  }
};

function printLine(k, v) {
  log.printf('%-20s %s', k, v);
}

function getVersion() {
  let version = require('../../package.json').version;

  try {
    const commit = require('../../.env.json').commit.short;
    if (commit) version += '-' + commit;
  } catch (e) {}

  return version;
}

cmd.handler = function(argv) {
  session.argv = argv;
  const version = getVersion();

  if (!log.isEnabled('DEBUG'))
    return log.info(version);

  const logo = [
    ' _           _                  _      ',
    '| |         | |                | |     ',
    '| | ___  ___| |_  ___  ___   __| | ___ ',
    '| |/ _ \\/ _ \\ __|/ __|/ _ \\ / _` |/ _ \\',
    '| |  __/  __/ |_  (__| (_) | (_| |  __/',
    '|_|\\___|\\___|\\__|\\___|\\___/ \\__,_|\\___|  CLI ' + chalk.green('v' + version)
  ].join('\n');
  log.info(logo);

  const os = require('os');
  const config = require('../config');

  log.info('\n[Environment]');
  printLine('Node', process.version);
  printLine('OS', os.platform() + ' ' + os.release());
  printLine('Cache', file.cacheDir());
  printLine('Config', file.configFile());

  log.info('\n[Configuration]');
  _.each(config.getAll(true), function(v, k) {
    if (k === 'plugins') return;
    printLine(k, JSON.stringify(v));
  });

  log.info('\n[Themes]');
  printLine('Colors', Array.from(chalk.themes.keys()));
  printLine('Icons', Array.from(icon.themes.keys()));

  log.info('\n[Plugins]');
  for (let p of Plugin.plugins) printLine(p.name, p.ver);
};

module.exports = cmd;
