var _ = require('underscore');
var style = require('ansi-styles');
var supportsColor = require('supports-color');

var chalk = {
  enabled: supportsColor,
  use256:  supportsColor && supportsColor.has256,
  themes:  {},
  theme:   {}
};

var pres = [];
var posts = [];

var DEFAULT = {
  black:   "#000000",
  blue:    "#0000ff",
  cyan:    "#00ffff",
  gray:    "#999999",
  green:   "#00ff00",
  magenta: "#ff00ff",
  red:     "#ff0000",
  white:   "#ffffff",
  yellow:  "#ffff00"
};

chalk.setTheme = function(name) {
  var theme = this.themes[name] || this.themes.default || {};
  this.theme = _.extendOwn(DEFAULT, theme);
};

chalk.print = function(s) {
  s = this.enabled ? pres.join('') + s + posts.join('') : s;
  pres.length = posts.length = 0;
  return s;
};

chalk.wrap = function(pre, post) {
  pres.push(pre);
  posts.unshift(post);
  var f = function(s) {
    return chalk.print(s);
  };
  f.__proto__ = chalk;
  return f;
};

chalk.init = function() {
  var h = require('./helper');
  _.each(h.getDirData('colors'), function(f) {
    chalk.themes[f.name] = _.mapObject(f.data, function(v, k) {
      return chalk.use256 ? style.color.ansi256.hex(v) : style.color.ansi.hex(v);
    });
  });

  _.chain(['black', 'blue', 'cyan', 'gray', 'green', 'magenta', 'red', 'white', 'yellow'])
  .each(function(color) {
    Object.defineProperty(chalk, color, {
      get: function() {
        return chalk.wrap(chalk.theme[color], style.color.close);
      }
    });
  });

  _.chain(['bold', 'dim', 'italic', 'inverse', 'strikethrough', 'underline'])
  .each(function(modifier) {
    Object.defineProperty(chalk, modifier, {
      get: function() {
        return chalk.wrap(style[modifier].open, style[modifier].close);
      }
    });
  });
};

module.exports = chalk;
