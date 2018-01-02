'use strict';
var fs = require('fs');

var h = require('../helper');
var chalk = require('../chalk');
var config = require('../config');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

const cmd = {
  command: 'plugin [name]',
  aliases: ['extension', 'ext'],
  desc:    'Manage plugins',
  builder: function(yargs) {
    return yargs
      .option('c', {
        alias:    'config',
        type:     'boolean',
        describe: 'Show plugin config',
        default:  false
      })
      .option('d', {
        alias:    'disable',
        type:     'boolean',
        describe: 'Disable plugin',
        default:  false
      })
      .option('D', {
        alias:    'delete',
        type:     'boolean',
        describe: 'Delete plugin',
        default:  false
      })
      .option('e', {
        alias:    'enable',
        type:     'boolean',
        describe: 'Enable plugin',
        default:  false
      })
      .option('i', {
        alias:    'install',
        type:     'boolean',
        describe: 'Install plugin',
        default:  false
      })
      .positional('name', {
        type:     'string',
        describe: 'Filter plugin by name',
        default:  ''
      })
      .example(chalk.yellow('leetcode plugin'), 'Show all plugins')
      .example(chalk.yellow('leetcode plugin company'), 'Show company plugin')
      .example(chalk.yellow('leetcode plugin company -c'), 'Show config of company plugin')
      .example(chalk.yellow('leetcode plugin -i company'), 'Install company plugin from GtiHub')
      .example(chalk.yellow('leetcode plugin -d company'), 'Disable company plugin')
      .example(chalk.yellow('leetcode plugin -e company'), 'Enable comapny plugin')
      .example(chalk.yellow('leetcode plugin -D company'), 'Delete company plugin');
  }
};

cmd.handler = function(argv) {
  session.argv = argv;

  const name = argv.name;
  if (argv.install) {
    Plugin.install(name, function(e, plugin) {
      if (e) return log.error(e);
      plugin.help();
    });
    return;
  }

  let plugins = Plugin.plugins;
  if (name) {
    plugins = plugins.filter(x => x.name === name);
  }
  if (plugins.length === 0) return log.error('Plugin not found!');

  const plugin = plugins[0];
  const fullpath = h.getPluginFile(plugin.file);

  if (argv.enable) {
    if (plugin.enabled) return;
    const newname = h.getPluginFile(plugin.file.substr(1));

    fs.rename(fullpath, newname, function(e) {
      if (e) log.error(e.message);
    });
  } else if (argv.disable) {
    if (!plugin.enabled) return;
    const newname = h.getPluginFile('.' + plugin.file);

    fs.rename(fullpath, newname, function(e) {
      if (e) log.error(e.message);
    });
  } else if (argv.delete) {
    fs.unlink(fullpath, function(e) {
      if (e) log.error(e.message);
    });
  } else if (argv.config) {
    log.info(JSON.stringify(config.plugins[name] || {}, null, 2));
  } else {
    plugins.forEach(function(p) {
      log.printf('%s %-18s %-15s %s', h.prettyText('', p.enabled), p.name, p.ver, p.desc);
    });
  }
};

module.exports = cmd;
