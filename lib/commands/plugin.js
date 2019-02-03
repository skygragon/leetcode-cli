'use strict';
var h = require('../helper');
var chalk = require('../chalk');
var config = require('../config');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');
var sprintf = require('../sprintf');

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
      .example('', '')
      .example(chalk.yellow('leetcode plugin -i'), 'Install all missing plugins from GitHub')
      .example(chalk.yellow('leetcode plugin -i company'), 'Install company plugin from GitHub')
      .example(chalk.yellow('leetcode plugin -d company'), 'Disable company plugin')
      .example(chalk.yellow('leetcode plugin -e company'), 'Enable company plugin')
      .example(chalk.yellow('leetcode plugin -D company'), 'Delete company plugin');
  }
};

function print(plugins) {
  log.info(chalk.gray(sprintf(' %6s  %-18s %-15s %s', 'Active', 'Name', 'Version', 'Desc')));
  log.info(chalk.gray('-'.repeat(100)));

  plugins = plugins || Plugin.plugins;
  for (let p of plugins)
    log.printf('   %s     %-18s %-15s %s',
      h.prettyText('', p.enabled && !p.missing),
      p.name, p.ver, p.desc);
}

cmd.handler = function(argv) {
  session.argv = argv;

  let plugins = Plugin.plugins;
  const name = argv.name;

  if (argv.install) {
    const cb = function(e, p) {
      if (e) return log.fatal(e);
      p.help();
      p.save();
      Plugin.init();
      print();
    };

    if (name) {
      Plugin.install(name, cb);
    } else {
      Plugin.installMissings(cb);
    }
    return;
  }

  if (name) plugins = plugins.filter(x => x.name === name);
  if (plugins.length === 0) return log.fatal('Plugin not found!');

  const p = plugins[0];
  if (p.missing && (argv.enable || argv.disable))
    return log.fatal('Plugin missing, install it first');

  if (argv.enable) {
    p.enabled = true;
    p.save();
    print();
  } else if (argv.disable) {
    p.enabled = false;
    p.save();
    print();
  } else if (argv.delete) {
    p.delete();
    p.save();
    Plugin.init();
    print();
  } else if (argv.config) {
    log.info(JSON.stringify(config.plugins[name] || {}, null, 2));
  } else {
    print(plugins);
  }
};

module.exports = cmd;
