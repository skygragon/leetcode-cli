'use strict';
var _ = require('underscore');

var file = require('./file');

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
  const defaultName = file.isWindows() ? 'win7' : 'default';
  const theme = this.themes.get(name) || this.themes.get(defaultName) || {};
  _.extendOwn(this, theme);
};

icons.init = function() {
  for (let f of file.listCodeDir('icons'))
    icons.themes.set(f.name, f.data);
};

module.exports = icons;
