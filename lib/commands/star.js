var log = require('loglevel');
var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'star <keyword>',
  desc:    'star problem by name or index'
};

cmd.handler = function(argv) {
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);
    core.starProblem(problem, function(e) {
      if (e) return log.fail(e);
      log.info(h.prettyText(' Starred', true));
    });
  });
};

module.exports = cmd;
