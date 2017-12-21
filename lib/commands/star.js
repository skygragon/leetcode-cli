var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var core = require('../core');
var session = require('../session');

var cmd = {
  command: 'star <keyword>',
  aliases: ['like', 'favorite'],
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
  session.argv = argv;
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);

    core.starProblem(problem, !argv.delete, function(e, starred) {
      if (e) return log.fail(e);

      log.printf('[%d] %s %s', problem.id, problem.name,
          chalk.yellow(starred ? icon.like : icon.unlike));

      core.updateProblem(problem, {starred: starred});
    });
  });
};

module.exports = cmd;
