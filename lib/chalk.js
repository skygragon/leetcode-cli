'use strict';
var _ = require('underscore');
var style = require('ansi-styles');
var supportsColor = require('supports-color');

const chalk = {
  enabled: supportsColor.stdout,
  use256:  supportsColor.stdout && supportsColor.stdout.has256,
  themes:  {},
  theme:   {}
};

const pres = [];
const posts = [];

const DEFAULT = {
  black:   '#000000',
  blue:    '#0000ff',
  cyan:    '#00ffff',
  gray:    '#999999',
  green:   '#00ff00',
  magenta: '#ff00ff',
  red:     '#ff0000',
  white:   '#ffffff',
  yellow:  '#ffff00'
};

chalk.setTheme = function(name) {
  const theme = this.themes[name] || this.themes.default || {};
  this.theme = _.extendOwn(DEFAULT, theme);
};

chalk.sprint = function(s, hex) {
  const color = chalk.use256 ? style.color.ansi256.hex(hex) : style.color.ansi.hex(hex);
  return color + s + style.color.close;
};

chalk.print = function(s) {
  s = this.enabled ? pres.join('') + s + posts.join('') : s;
  pres.length = posts.length = 0;
  return s;
};

chalk.wrap = function(pre, post) {
  pres.push(pre);
  posts.unshift(post);
  const f = x => chalk.print(x);
  Object.setPrototypeOf(f, chalk);
  return f;
};

const bgName = x => 'bg' + x[0].toUpperCase() + x.substr(1);

chalk.init = function() {
  require('./helper').getCodeDirData('colors').forEach(function(f) {
    const o = {};
    _.pairs(f.data).forEach(function(x) {
      const k = x[0];
      const v = x[1];
      const bgK = bgName(k);

      if (chalk.use256) {
        o[k] = style.color.ansi256.hex(v);
        o[bgK] = style.bgColor.ansi256.hex(v);
      } else {
        o[k] = style.color.ansi.hex(v);
        o[bgK] = style.bgColor.ansi.hex(v);
      }
    });
    chalk.themes[f.name] = o;
  });

  _.chain(['black', 'blue', 'cyan', 'gray', 'green', 'magenta', 'red', 'white', 'yellow'])
  .each(function(color) {
    Object.defineProperty(chalk, color, {
      get:          () => chalk.wrap(chalk.theme[color], style.color.close),
      configurable: true
    });
    const bgcolor = bgName(color);
    Object.defineProperty(chalk, bgcolor, {
      get:          () => chalk.wrap(chalk.theme[bgcolor], style.bgColor.close),
      configurable: true
    });
  });

  _.chain(['bold', 'dim', 'italic', 'inverse', 'strikethrough', 'underline'])
  .each(function(modifier) {
    Object.defineProperty(chalk, modifier, {
      get:          () => chalk.wrap(style[modifier].open, style[modifier].close),
      configurable: true
    });
  });
};

module.exports = chalk;
