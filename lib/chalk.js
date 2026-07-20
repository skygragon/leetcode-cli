'use strict';
var _ = require('underscore');
// TODO: remove .default when using ES6 import syntax 
var style = require('ansi-styles').default; 
var convert = require('color-convert').default;
var supportsColor = require('supports-color').default;

var file = require('./file');

const chalk = {
  enabled: supportsColor.stdout,
  use256:  supportsColor.stdout && supportsColor.stdout.has256,
  use16m:  supportsColor.stdout && supportsColor.stdout.has16m,
  themes:  new Map(),
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
  this.theme = this.themes.get(name) || this.themes.get('default');
};

chalk.sprint = function (s, hex) {
  let color;
  if (chalk.use16m) {
    color = style.color.ansi16m(...style.hexToRgb(hex));
  } else if (chalk.use256) {
    color = style.color.ansi256(style.hexToAnsi256(hex));
  } else {
    color = '\u001B[' + convert.hex.ansi16(hex) + 'm';
  }
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
  for (let f of file.listCodeDir('colors')) {
    const theme = {};
    const data = _.extendOwn({}, DEFAULT, f.data);
    for (let x of _.pairs(data)) {
      const k = x[0];
      const v = x[1];
      const bgK = bgName(k);

      if (chalk.use16m) {
        const [r, g, b] = style.hexToRgb(v);
        theme[k] = style.color.ansi16m(r, g, b);
        theme[bgK] = style.bgColor.ansi16m(r, g, b);
      } else if (chalk.use256) {
        const color256 = style.hexToAnsi256(v);
        theme[k] = style.color.ansi256(color256);
        theme[bgK] = style.bgColor.ansi256(color256);
      } else {
        const code = convert.hex.ansi16(v);
        theme[k] = `\u001B[${code}m`;
        theme[bgK] = `\u001B[${code + 10}m`;
      }
    }
    chalk.themes.set(f.name, theme);
  }

  for (let color of ['black', 'blue', 'cyan', 'gray', 'green', 'magenta', 'red', 'white', 'yellow']) {
    Object.defineProperty(chalk, color, {
      get:          () => chalk.wrap(chalk.theme[color], style.color.close),
      configurable: true
    });
    const bgcolor = bgName(color);
    Object.defineProperty(chalk, bgcolor, {
      get:          () => chalk.wrap(chalk.theme[bgcolor], style.bgColor.close),
      configurable: true
    });
  }

  for (let modifier of ['bold', 'dim', 'italic', 'inverse', 'strikethrough', 'underline']) {
    Object.defineProperty(chalk, modifier, {
      get:          () => chalk.wrap(style[modifier].open, style[modifier].close),
      configurable: true
    });
  }
};

module.exports = chalk;
