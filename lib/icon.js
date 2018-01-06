'use strict';
var _ = require('underscore');

var h = require('./helper');

const icons = {
  yes:    '✔',
  no:     '✘',
  like:   '★',
  unlike: '☆',
  lock:   '🔒',
  empty:  ' ',
  ac:     '▣',
  notac:  '▤',
  none:   '⬚',

  themes: new Map()
};

icons.setTheme = function(name) {
  const defaultName = h.isWindows() ? 'win7' : 'default';
  const theme = this.themes.get(name) || this.themes.get(defaultName) || {};
  _.extendOwn(this, theme);
};

icons.init = function() {
  for (let f of h.getCodeDirData('icons'))
    icons.themes.set(f.name, f.data);
};

module.exports = icons;
