var _ = require('underscore');
var style = require('ansi-styles');

function rgb(r, g, b) {
  return style.color.ansi256.rgb(r, g, b);
}

var THEMES = {
  'default': {
    black:   rgb(0, 0, 0),
    blue:    rgb(0, 0, 255),
    cyan:    rgb(0, 255, 255),
    green:   rgb(0, 255, 0),
    magenta: rgb(255, 0, 255),
    red:     rgb(255, 0, 0),
    white:   rgb(255, 255, 255),
    yellow:  rgb(255, 255, 0)
  },
  'dark': {
    black:   rgb(0, 0, 0),
    blue:    rgb(0, 0, 153),
    cyan:    rgb(0, 153, 153),
    green:   rgb(0, 153, 0),
    magenta: rgb(153, 0, 153),
    red:     rgb(153, 0, 0),
    white:   rgb(255, 255, 255),
    yellow:  rgb(153, 153, 0)
  },
  'pink': {
    black:   rgb(0, 0, 0),
    blue:    rgb(0, 0, 153),
    cyan:    rgb(0, 153, 153),
    green:   rgb(255, 20, 147),
    magenta: rgb(153, 0, 153),
    red:     rgb(220, 20, 60),
    white:   rgb(255, 255, 255),
    yellow:  rgb(255, 69, 0)
  }
};

var chalk = {
  enabled: true,
  theme:   THEMES.default
};

var pres = [];
var posts = [];

chalk.setTheme = function(name) {
  this.theme = THEMES[name] || THEMES.default;
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

_.chain(['black', 'blue', 'cyan', 'green', 'magenta', 'red', 'white', 'yellow'])
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

module.exports = chalk;
