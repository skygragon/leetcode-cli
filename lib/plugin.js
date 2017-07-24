var _ = require('underscore');

var h = require('./helper');
var log = require('./log');

function Plugin(id, name, ver, desc) {
  this.id = id;
  this.name = name;
  this.ver = ver;
  this.desc = desc;
  this.next = null;
}

Plugin.prototype.init = function() {
};

Plugin.prototype.setNext = function(next) {
  this.next = this.__proto__ = next;
};

Plugin.plugins = [];

Plugin.init = function(head) {
  var plugins = [];
  h.getDirData(['lib', 'plugins']).forEach(function(f) {
    var p = f.data;
    if (!p) return;

    log.trace('found plugin: ' + p.name + '=' + p.ver);
    p.init();
    plugins.push(p);
    log.trace('inited plugin: ' + p.name);
  });

  // chain the plugins together
  // the one has bigger `id` comes first
  plugins = _.sortBy(plugins, function(p) {
    return -p.id;
  });

  var last = head;
  plugins.forEach(function(p) {
    last.setNext(p);
    last = p;
  });
  Plugin.plugins = plugins;
};

module.exports = Plugin;
