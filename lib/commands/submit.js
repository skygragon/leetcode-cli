'use strict';
var util = require('util');

var h = require('../helper');
var file = require('../file');
var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');

const cmd = {
  command: 'submit <filename>',
  aliases: ['push', 'commit'],
  desc:    'Submit code',
  builder: function(yargs) {
    return yargs
      .positional('filename', {
        type:     'string',
        describe: 'Code file to submit',
        default:  ''
      })
      .example(chalk.yellow('leetcode submit 1.two-sum.cpp'), 'Submit code');
  }
};

function printResult(actual, k) {
  if (!actual.hasOwnProperty(k)) return;

  const v = actual[k] || '';
  const lines = Array.isArray(v) ? v : [v];
  for (let line of lines) {
    if (k !== 'state') line = k + ': ' + line;
    log.info('  ' + h.prettyText(' ' + line, actual.ok));
  }
}

function printLine() {
  const args = Array.from(arguments);
  const actual = args.shift();
  const line = util.format.apply(util, args);
  log.info('  ' + h.prettyText(' ' + line, actual.ok));
}

cmd.handler = function(argv) {
  session.argv = argv;
  if (!file.exist(argv.filename))
    return log.fatal('File ' + argv.filename + ' not exist!');

  const meta = file.meta(argv.filename);

  core.getProblem(meta.id, function(e, problem) {
    if (e) return log.fail(e);

    problem.file = argv.filename;
    problem.lang = meta.lang;

    core.submitProblem(problem, function(e, results) {
      if (e) return log.fail(e);

      const result = results[0];

      printResult(result, 'state');
      printLine(result, '%d/%d cases passed (%s)',
          result.passed, result.total, result.runtime);

      if (result.ok) {
        session.updateStat('ac', 1);
        session.updateStat('ac.set', problem.fid);
        if (result.runtime_percentile)
          printLine(result, 'Your runtime beats %d %% of %s submissions',
              result.runtime_percentile.toFixed(2), result.lang);
        else
          return log.warn('Failed to get runtime percentile.');
        if (result.memory && result.memory_percentile)
          printLine(result, 'Your memory usage beats %d %% of %s submissions (%s)',
              result.memory_percentile.toFixed(2), result.lang, result.memory);
        else
          return log.warn('Failed to get memory percentile.');
      } else {
        printResult(result, 'error');
        printResult(result, 'testcase');
        printResult(result, 'answer');
        printResult(result, 'expected_answer');
        printResult(result, 'stdout');
      }

      // update this problem status in local cache
      core.updateProblem(problem, {state: (result.ok ? 'ac' : 'notac')});
    });
  });
};

module.exports = cmd;
