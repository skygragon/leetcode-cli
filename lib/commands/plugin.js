var fs = require('fs');

var h = require('../helper');
var config = require('../config');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

var cmd = {
  command: 'plugin [name]',
  aliases: ['extension', 'ext'],
  desc:    'Manage plugins',
  builder: {
    c: {
      alias:    'config',
      type:     'boolean',
      describe: 'Show plugin config',
      default:  false
    },
    d: {
      alias:    'disable',
      type:     'boolean',
      describe: 'Disable plugin',
      default:  false
    },
    D: {
      alias:    'delete',
      type:     'boolean',
      describe: 'Delete plugin',
      default:  false
    },
    e: {
      alias:    'enable',
      type:     'boolean',
      describe: 'Enable plugin',
      default:  false
    },
    i: {
      alias:    'install',
      type:     'boolean',
      describe: 'Install plugin',
      default:  false
    }
  }
};

cmd.handler = function(argv) {
  session.argv = argv;

  var name = argv.name;
  if (argv.install) {
    Plugin.install(name, function(e, plugin) {
      if (e) return log.error(e);
      plugin.help();
    });
    return;
  }

  var plugins = Plugin.plugins;
  if (name) {
    plugins = plugins.filter(function(p) {
      return p.name === name;
    });
  }
  if (plugins.length === 0) return log.error('Plugin not found!');

  var plugin = plugins[0];
  var fullpath = h.getPluginFile(plugin.file);
  var newname;

  if (argv.enable) {
    if (plugin.enabled) return;
    newname = h.getPluginFile(plugin.file.substr(1));

    fs.rename(fullpath, newname, function(e) {
      if (e) log.error(e.message);
    });
  } else if (argv.disable) {
    if (!plugin.enabled) return;
    newname = h.getPluginFile('.' + plugin.file);

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
