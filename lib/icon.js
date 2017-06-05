var _ = require('underscore');

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
  var defaultName = process.platform === 'win32' ? 'win7' : 'default';
  var theme = this.themes[name] || this.themes[defaultName] || {};
  _.extendOwn(this, theme);
};

icons.init = function() {
  var h = require('./helper');
  _.each(h.getDirData('icons'), function(f) {
    icons.themes[f.name] = f.data;
  });
};

module.exports = icons;
