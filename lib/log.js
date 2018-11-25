'use strict';
var _ = require('underscore');

var chalk = require('./chalk');
var sprintf = require('./sprintf');

const log = {
  output: _.bind(console.log, console),
  level:  null,
  levels: new Map([
    ['TRACE', {value: 0, color: 'gray'}],
    ['DEBUG', {value: 1, color: 'gray'}],
    ['INFO',  {value: 2, color: ''}],
    ['WARN',  {value: 3, color: 'yellow'}],
    ['ERROR', {value: 4, color: 'red'}]
  ])
};

log.setLevel = function(name) {
  this.level = this.levels.get(name) || this.levels.get('INFO');
};

log.isEnabled = function(name) {
  return this.level.value <= this.levels.get(name).value;
};

log.fail = function(e) {
  let msg = sprintf('%s', (e.msg || e));
  if (e.statusCode) {
    msg += sprintf(' [code=%s]', e.statusCode);
  }
  log.error(msg);
};

log.fatal = function(e) {
  log.error(e);
  process.exit(1);
};

log.printf = function() {
  log.info(sprintf.apply(null, Array.from(arguments)));
};

log.init = function() {
  this.setLevel('INFO');

  for (let name of this.levels.keys()) {
    log[name.toLowerCase()] = function() {
      const level = log.levels.get(name);
      if (log.level.value > level.value) return;

      const args = Array.from(arguments);
      if (name !== 'INFO') args.unshift('[' + name + ']');

      let s = args.map(x => x.toString()).join(' ');
      if (level.color) s = chalk[level.color](s);

      this.output(s);
    };
  }
};

module.exports = log;
