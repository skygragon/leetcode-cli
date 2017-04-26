var _ = require('underscore');
var style = require('ansi-styles');

var chalk = {
  enabled: true,
  themes:  {},
  theme:   {}
};

var pres = [];
var posts = [];

chalk.setTheme = function(name) {
  this.theme = this.themes[name] || this.themes.default || {};
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
  var fs = require('fs');
  var path = require('path');

  var dir = path.join(__dirname, '..', 'colors');
  _.each(fs.readdirSync(dir), function(f) {
    var theme = JSON.parse(fs.readFileSync(path.join(dir, f)));
    chalk.themes[path.basename(f, '.json')] = _.mapObject(theme, function(v, k) {
      return style.color.ansi256.hex(v);
    });
  });

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
};

chalk.init();
module.exports = chalk;
