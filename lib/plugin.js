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

Plugin.plugins = {};

Plugin.init = function(root) {
  h.getDirData(['lib', 'plugins']).forEach(function(f) {
    var p = f.data;
    if (!p) return;

    log.trace('found plugin: ' + p.id + '=' + p.ver);
    p.init();
    Plugin.plugins[f.name] = p;
    log.trace('inited plugin: ' + p.id);
  });

  var last = root;
  var chains = ['retry', 'cache', 'leetcode'];
  chains.forEach(function(name) {
    var p = Plugin.plugins[name];
    last.setNext(p);
    last = p;
  });
};

module.exports = Plugin;
