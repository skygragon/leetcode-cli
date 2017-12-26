var _ = require('underscore');

var h = require('./helper');

var icons = {
  yes:    '✔',
  no:     '✘',
  like:   '★',
  unlike: '☆',
  lock:   '🔒',
  none:   ' ',

  themes: []
};

icons.setTheme = function(name) {
  var defaultName = h.isWindows() ? 'win7' : 'default';
  var theme = this.themes[name] || this.themes[defaultName] || {};
  _.extendOwn(this, theme);
};

icons.init = function() {
  _.each(h.getCodeDirData('icons'), function(f) {
    icons.themes[f.name] = f.data;
  });
};

module.exports = icons;
