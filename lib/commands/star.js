'use strict';
var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var core = require('../core');
var session = require('../session');

const cmd = {
  command: 'star <keyword>',
  aliases: ['like', 'favorite'],
  desc:    'Star favorite question',
  builder: function(yargs) {
    return yargs
      .option('d', {
        alias:    'delete',
        type:     'boolean',
        describe: 'Unstar question',
        default:  false
      })
      .positional('keyword', {
        type:     'string',
        describe: 'Question name or id',
        default:  ''
      })
      .example(chalk.yellow('leetcode star 1'), 'Mark favorite to question 1')
      .example(chalk.yellow('leetcode star 1 -d'), 'Unmark favorite to question 1');
  }
};

cmd.handler = function(argv) {
  session.argv = argv;
  // translation doesn't affect question lookup
  core.getProblem(argv.keyword, true, function(e, problem) {
    if (e) return log.fail(e);

    core.starProblem(problem, !argv.delete, function(e, starred) {
      if (e) return log.fail(e);

      log.printf('[%s] %s %s', problem.fid, problem.name,
          chalk.yellow(starred ? icon.like : icon.unlike));

      core.updateProblem(problem, {starred: starred});
    });
  });
};

module.exports = cmd;
