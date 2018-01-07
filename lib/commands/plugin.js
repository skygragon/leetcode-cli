'use strict';
var sprintf = require('sprintf-js').sprintf;

var h = require('../helper');
var chalk = require('../chalk');
var config = require('../config');
var log = require('../log');
var Plugin = require('../plugin');
var Queue = require('../queue');
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
      .example('', '')
      .example(chalk.yellow('leetcode plugin -i'), 'Install all missing plugins from GtiHub')
      .example(chalk.yellow('leetcode plugin -i company'), 'Install company plugin from GtiHub')
      .example(chalk.yellow('leetcode plugin -d company'), 'Disable company plugin')
      .example(chalk.yellow('leetcode plugin -e company'), 'Enable comapny plugin')
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
  Plugin.save();
}

function install(plugins) {
  function doTask(plugin, queue, cb) {
    Plugin.install(plugin.name, function(e, p) {
      if (!e) {
        p.enable(plugin.enabled);
        p.save();
        p.help();
      }
      return cb(e);
    });
  }

  const q = new Queue(plugins, {}, doTask);
  q.run(1, function(e) {
    if (e) return log.fail(e);
    Plugin.init();
    print();
  });
}

cmd.handler = function(argv) {
  session.argv = argv;

  let plugins = Plugin.plugins;
  const name = argv.name;

  if (argv.install) {
    if (name) {
      install([new Plugin(-1, name, 'missing')]);
    } else {
      plugins = plugins.filter(x => x.missing);
      install(plugins);
    }
    return;
  }

  if (name) plugins = plugins.filter(x => x.name === name);
  if (plugins.length === 0) return log.error('Plugin not found!');

  const plugin = plugins[0];
  if (plugin.missing && (argv.enable || argv.disable))
    return log.error('Plugin missing, install it first');

  if (argv.enable) {
    plugin.enable(true);
    plugin.save();
    print();
  } else if (argv.disable) {
    plugin.enable(false);
    plugin.save();
    print();
  } else if (argv.delete) {
    plugin.delete();
    plugin.save();
    Plugin.init();
    print();
  } else if (argv.config) {
    log.info(JSON.stringify(config.plugins[name] || {}, null, 2));
  } else {
    print(plugins);
  }
};

module.exports = cmd;
