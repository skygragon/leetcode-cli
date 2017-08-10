var fs = require('fs');
var path = require('path');

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
    enable: {
      alias:    'e',
      type:     'boolean',
      describe: 'Enable plugin',
      default:  false
    },
    disable: {
      alias:    'd',
      type:     'boolean',
      describe: 'Disable plugin',
      default:  false
    },
    delete: {
      alias:    'D',
      type:     'boolean',
      describe: 'Delete plugin',
      default:  false
    }
  }
};

function install(name) {
  // copy to plugins folder
  var newname = path.join(Plugin.dir, path.basename(name));
  var src = fs.createReadStream(name);
  src.pipe(fs.createWriteStream(newname));
  src.on('end', function() {
    log.debug('copied to ' + newname);

    // install dependencies
    var plugin = require(path.relative(__dirname, newname));
    if (plugin.deps.length === 0) return;

    var cmd = 'npm install --save ' + plugin.deps.join(' ');
    log.debug(cmd);
    require('child_process').execSync(cmd, {
      cwd: path.resolve(__dirname, '../..')
    });
  });
}

cmd.handler = function(argv) {
  session.argv = argv;
  var name = argv.name;

  if (argv.install) {
    if (!name || !fs.existsSync(name)) return log.error('Plugin not found!');
    return install(name);
  }

  var plugins = Plugin.plugins;
  if (name) {
    plugins = plugins.filter(function(p) {
      return p.name === name;
    });
  }

  if (!argv.enable && !argv.disable && !argv.delete) {
    plugins.forEach(function(p) {
      log.printf('%s %-18s %-15s %s', h.prettyText('', p.enabled), p.name, p.ver, p.desc);
    });
    return;
  }

  if (plugins.length === 0) return log.error('Plugin not found!');

  var plugin = plugins[0];
  var oldname = Plugin.fullpath(plugin.file);
  var newname;

  if (argv.enable) {
    if (plugin.file[0] !== '.') return;
    newname = Plugin.fullpath(plugin.file.substr(1));

    fs.rename(oldname, newname, function(e) {
      if (e) log.error(e.message);
    });
  } else if (argv.disable) {
    if (plugin.file[0] === '.') return;
    newname = Plugin.fullpath('.' + plugin.file);

    fs.rename(oldname, newname, function(e) {
      if (e) log.error(e.message);
    });
  } else if (argv.delete) {
    fs.unlink(oldname, function(e) {
      if (e) log.error(e.message);
    });
  }
};

module.exports = cmd;
