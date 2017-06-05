var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;

var chalk = require('../chalk');
var core = require('../core');
var icon = require('../icon');

var cmd = {
  command: 'star <keyword>',
  desc:    'Star problem by name or index',
  builder: {
    delete: {
      alias:    'd',
      type:     'boolean',
      describe: 'Unstar the problem',
      default:  false
    }
  }
};

cmd.handler = function(argv) {
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);

    core.starProblem(problem, !argv.delete, function(e, starred) {
      if (e) return log.fail(e);

      log.info(sprintf('[%d] %s %s',
            problem.id,
            problem.name,
            chalk.yellow(starred ? icon.like : icon.unlike)));

      core.updateProblem(problem, {starred: starred});
    });
  });
};

module.exports = cmd;
