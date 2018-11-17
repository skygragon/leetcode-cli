'use strict';
var _ = require('underscore');
var style = require('ansi-styles');
var supportsColor = require('supports-color');

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

chalk.sprint = function(s, hex) {
  const color = chalk.use16m ? style.color.ansi16m.hex(hex)
                             : chalk.use256 ? style.color.ansi256.hex(hex)
                                            : style.color.ansi.hex(hex);
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
        theme[k] = style.color.ansi16m.hex(v);
        theme[bgK] = style.bgColor.ansi16m.hex(v);
      } else if (chalk.use256) {
        theme[k] = style.color.ansi256.hex(v);
        theme[bgK] = style.bgColor.ansi256.hex(v);
      } else {
        theme[k] = style.color.ansi.hex(v);
        theme[bgK] = style.bgColor.ansi.hex(v);
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
