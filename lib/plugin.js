var path = require('path');

var _ = require('underscore');

var h = require('./helper');
var config = require('./config');
var log = require('./log');

function Plugin(id, name, ver, desc, deps) {
  this.id = id;
  this.name = name;
  this.ver = ver || 'default';
  this.desc = desc;
  this.enabled = true;
  this.deps = deps || [];
}

Plugin.prototype.init = function() {
  this.config = config.PLUGINS[this.name] || {};
  this.next = null;
};

Plugin.prototype.setNext = function(next) {
  Object.setPrototypeOf(this, next);
  this.next = next;
};

Plugin.plugins = [];

Plugin.init = function(head) {
  Plugin.dir = path.resolve(__dirname, '../lib/plugins/');

  var plugins = [];
  h.getDirData(['lib', 'plugins']).forEach(function(f) {
    var p = f.data;
    if (!p) return;

    p.file = f.file;
    if (f.name[0] === '.') p.enabled = false;

    log.trace('found plugin: ' + p.name + '=' + p.ver);
    if (p.enabled) {
      p.init();
      log.trace('inited plugin: ' + p.name);
    } else {
      log.trace('skipped plugin: ' + p.name);
    }

    plugins.push(p);
  });

  // chain the plugins together
  // the one has bigger `id` comes first
  plugins = _.sortBy(plugins, function(p) {
    return -p.id;
  });

  var last = head;
  plugins.forEach(function(p) {
    if (!p.enabled) return;
    last.setNext(p);
    last = p;
  });
  Plugin.plugins = plugins;
};

Plugin.fullpath = function(filename) {
  return path.join(Plugin.dir, filename);
};

module.exports = Plugin;
