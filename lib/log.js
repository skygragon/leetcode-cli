'use strict';
var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var chalk = require('./chalk');

const log = {
  output: _.bind(console.log, console),
  level:  null,
  levels: {
    TRACE: {value: 0, color: 'gray'},
    DEBUG: {value: 1, color: 'gray'},
    INFO:  {value: 2, color: ''},
    WARN:  {value: 3, color: 'yellow'},
    ERROR: {value: 4, color: 'red'}
  }
};

log.setLevel = function(name) {
  this.level = this.levels[name] || this.levels.INFO;
};

log.isEnabled = function(name) {
  return this.level.value <= this.levels[name].value;
};

log.fail = function(e) {
  log.error(sprintf('%s [%d]', (e.msg || e), (e.statusCode || 0)));
};

log.printf = function() {
  log.info(sprintf.apply(null, _.toArray(arguments)));
};

log.init = function() {
  this.setLevel('INFO');

  _.keys(this.levels).forEach(function(name) {
    log[name.toLowerCase()] = function() {
      const level = log.levels[name];
      if (log.level.value > level.value) return;

      const args = _.toArray(arguments);
      if (name !== 'INFO') args.unshift('[' + name + ']');

      let s = args.map(function(arg) { return arg.toString(); }).join(' ');
      if (level.color) s = chalk[level.color](s);

      this.output(s);
    };
  });
};

module.exports = log;
