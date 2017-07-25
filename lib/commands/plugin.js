var fs = require('fs');
var path = require('path');

var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var h = require('../helper');
var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

var cmd = {
  command: 'plugin [name]>',
  desc:    'show plugins',
  builder: {
    install: {
      alias:    'i',
      type:     'boolean',
      describe: 'Install plugin',
      default:  false
    },
    delete: {
      alias:    'd',
      type:     'boolean',
      describe: 'Delete plugin',
      default:  false
    }
  }
};

cmd.handler = function(argv) {
  session.argv = argv;
  var name = argv.name;

  if (argv.install) {
    if (!name || !fs.existsSync(name))
      return log.error('Plugin not found!');

    var newName = path.resolve(__dirname, '../plugins/' + path.basename(name));
    fs.createReadStream(name).pipe(fs.createWriteStream(newName));
    return;
  }

  if (argv.delete) {
    var f = _.find(h.getDirData(['lib', 'plugins']), function(f) {
      return f.data !== null && f.data.name === name;
    });
    if (!f) return log.error('Plugin not found!');

    fs.unlink(f.fullpath, function(e) {
      if (e) log.error(e.message);
    });
    return;
  }

  var plugins = Plugin.plugins;
  if (name) {
    plugins = plugins.filter(function(p) {
      return p.name === name;
    });
  }
  plugins.forEach(function(p) {
    log.info(sprintf('%-20s %-15s %s', p.name, p.ver, p.desc));
  });
};

module.exports = cmd;
