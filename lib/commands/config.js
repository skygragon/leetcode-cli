'use strict';
var _ = require('underscore');
var nconf = require('nconf');

var h = require('../helper');
var chalk = require('../chalk');
var config = require('../config');
var log = require('../log');
var session = require('../session');

const cmd = {
  command: 'config [key] [value]',
  aliases: ['conf', 'cfg', 'setting'],
  desc:    'Manage user configs',
  builder: function(yargs) {
    return yargs
      .option('a', {
        alias:    'all',
        type:     'boolean',
        describe: 'Show all config',
        default:  false
      })
      .option('d', {
        alias:    'delete',
        type:     'boolean',
        describe: 'Delete config by key',
        default:  false
      })
      .positional('key', {
        type:     'string',
        describe: 'Config key',
        default:  ''
      })
      .positional('value', {
        type:     'string',
        describe: 'Config value',
        default:  ''
      })
      .example(chalk.yellow('leetcode config'), 'Show user configs')
      .example(chalk.yellow('leetcode config -a'), 'Show all configs = user + default')
      .example(chalk.yellow('leetcode config plugins:github:repo "your repo URL"'), 'Set config by key')
      .example(chalk.yellow('leetcode config plugins:github'), 'Show config by key')
      .example(chalk.yellow('leetcode config plugins:github -d'), 'Delete config by key');
  }
};

function prettyConfig(cfg) {
  return JSON.stringify(cfg, null, 2);
}

function loadConfig(showall) {
  const cfg = showall ? config.getAll(true) : nconf.get();
  return _.omit(cfg, 'type');
}

function saveConfig() {
  require('fs').writeFileSync(h.getConfigFile(), prettyConfig(loadConfig(false)));
}

cmd.handler = function(argv) {
  session.argv = argv;
  nconf.file('local', h.getConfigFile());

  // show all
  if (argv.key.length === 0)
    return log.info(prettyConfig(loadConfig(argv.all)));

  const v = nconf.get(argv.key);

  // delete
  if (argv.delete) {
    if (v === undefined) return log.error('Key not found: ' + argv.key);
    nconf.clear(argv.key);
    return saveConfig();
  }

  // show
  if (argv.value.length === 0) {
    if (v === undefined) return log.error('Key not found: ' + argv.key);
    return log.info(prettyConfig(v));
  }

  // set
  try {
    nconf.set(argv.key, JSON.parse(argv.value));
  } catch (e) {
    nconf.set(argv.key, JSON.parse('"' + argv.value + '"'));
  }
  return saveConfig();
};

module.exports = cmd;
