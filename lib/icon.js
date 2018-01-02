'use strict';
var _ = require('underscore');

var h = require('./helper');

const icons = {
  yes:    '✔',
  no:     '✘',
  like:   '★',
  unlike: '☆',
  lock:   '🔒',
  none:   ' ',

  themes: []
};

icons.setTheme = function(name) {
  const defaultName = h.isWindows() ? 'win7' : 'default';
  const theme = this.themes[name] || this.themes[defaultName] || {};
  _.extendOwn(this, theme);
};

icons.init = function() {
  h.getCodeDirData('icons').forEach(function(f) {
    icons.themes[f.name] = f.data;
  });
};

module.exports = icons;
