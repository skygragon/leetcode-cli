'use strict';
var cp = require('child_process');
var fs = require('fs');
var path = require('path');

var _ = require('underscore');
var request = require('request');

var h = require('./helper');
var file = require('./file');
var cache = require('./cache');
var config = require('./config');
var log = require('./log');
var Queue = require('./queue');

function Plugin(id, name, ver, desc, deps) {
  this.id = id;
  this.name = name;
  this.ver = ver || 'default';
  this.desc = desc || '';

  this.enabled = true;
  this.deleted = false;
  this.missing = (ver === 'missing');

  // only need deps for current platform
  this.deps = _.chain(deps || [])
    .filter(x => ! x.includes(':') || x.includes(':' + process.platform))
    .map(x => x.split(':')[0])
    .value();
}

Plugin.prototype.init = function() {
  this.config = config.plugins[this.name] || {};
  this.next = null;
};

Plugin.prototype.setNext = function(next) {
  Object.setPrototypeOf(this, next);
  this.next = next;
};

Plugin.prototype.setFile = function(f) {
  this.file = f;
  this.enabled = (this.file[0] !== '.');
};

Plugin.prototype.enable = function(enabled) {
  if (this.enabled === enabled) return;
  const newfile = enabled ? this.file.substr(1) : '.' + this.file;
  try {
    fs.renameSync(file.pluginFile(this.file), file.pluginFile(newfile));
  } catch(e) {
    log.error(e.message);
  }
  this.setFile(newfile);
};

Plugin.prototype.delete = function() {
  if (!this.missing) {
    try {
      const fullpath = file.pluginFile(this.file);
      fs.unlinkSync(fullpath);
    } catch(e) {
      return log.error(e.message);
    }
  }
  this.deleted = true;
};

Plugin.prototype.save = function() {
  const data = cache.get(h.KEYS.plugins) || {};

  if (this.deleted) delete data[this.name];
  else if (this.missing) return;
  else data[this.name] = this.enabled;

  cache.set(h.KEYS.plugins, data);
};

Plugin.prototype.install = function(cb) {
  if (this.deps.length === 0) return cb();

  const cmd = 'npm install --save ' + this.deps.join(' ');
  log.debug(cmd);
  const spin = h.spin(cmd);
  cp.exec(cmd, {cwd: file.codeDir()}, function() {
    spin.stop();
    return cb();
  });
};

Plugin.prototype.help = function() {};

Plugin.plugins = [];

Plugin.init = function(head) {
  log.trace('initializing all plugins');
  head = head || require('./core');

  // 1. check installed plugins
  let plugins = [];
  for (let f of file.listCodeDir('lib/plugins')) {
    const p = f.data;
    if (!p) continue;

    p.setFile(f.file);
    log.trace('found plugin: ' + p.name + '=' + p.ver);
    if (p.enabled) {
      p.init();
      log.trace('inited plugin: ' + p.name);
    } else {
      log.trace('skipped plugin: ' + p.name);
    }

    plugins.push(p);
  }

  // chain the plugins together
  // the one has bigger `id` comes first
  plugins = _.sortBy(plugins, x => -x.id);

  let last = head;
  for (let p of plugins) {
    if (!p.enabled) continue;
    last.setNext(p);
    last = p;
  }

  // 2. check saved plugins
  const missings = [];
  const data = cache.get(h.KEYS.plugins) || {};
  for (let k of _.keys(data)) {
    if (plugins.find(x => x.name === k)) continue;
    const p = new Plugin(-1, k, 'missing');
    p.enabled = data[k];
    missings.push(p);
  }
  log.trace('missing plugins: ' + missings.length);

  Plugin.plugins = plugins.concat(missings);
  return missings.length === 0;
};

Plugin.copy = function(src, cb) {
  // FIXME: remove local file support?
  if (path.extname(src) !== '.js') {
    src = config.sys.urls.plugin.replace('$name', src);
  }
  const dst = file.pluginFile(src);

  const srcstream = src.startsWith('https://') ? request(src) : fs.createReadStream(src);
  srcstream.on('response', function(resp) {
    if (resp.statusCode !== 200)
      srcstream.emit('error', 'HTTP Error: ' + resp.statusCode);
  });
  srcstream.on('error', function(e) {
    spin.stop();
    fs.unlinkSync(dst);
    return cb(e);
  });

  const dststream = fs.createWriteStream(dst);
  dststream.on('close', function() {
    spin.stop();
    return cb(null, dst);
  });

  log.debug('copying from ' + src);
  const spin = h.spin('Downloading ' + src);
  srcstream.pipe(dststream);
};

Plugin.install = function(name, cb) {
  Plugin.copy(name, function(e, fullpath) {
    if (e) return cb(e);
    log.debug('copied to ' + fullpath);

    const p = require(fullpath);
    p.install(function() {
      return cb(null, p);
    });
  });
};

Plugin.installMissings = function(cb) {
  function doTask(plugin, queue, cb) {
    Plugin.install(plugin.name, function(e, p) {
      if (!e) {
        p.enable(plugin.enabled);
        p.save();
        p.help();
      }
      return cb(e, p);
    });
  }

  const plugins = Plugin.plugins.filter(x => x.missing);
  if (plugins.length === 0) return cb();

  log.warn('Installing missing plugins, might take a while ...');
  const q = new Queue(plugins, {}, doTask);
  q.run(1, cb);
};

Plugin.save = function() {
  for (let p of this.plugins) p.save();
};

module.exports = Plugin;
