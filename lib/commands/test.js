'use strict';
var _ = require('underscore');
var lodash = require('lodash');
var util = require('util');

var h = require('../helper');
var file = require('../file');
var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');

const cmd = {
  command: 'test <filename>',
  aliases: ['run'],
  desc:    'Test code',
  builder: function(yargs) {
    return yargs
      .option('i', {
        alias:    'interactive',
        type:     'boolean',
        default:  false,
        describe: 'Provide test case interactively'
      })
      .option('t', {
        alias:    'testcase',
        type:     'string',
        default:  '',
        describe: 'Provide test case'
      })
      .positional('filename', {
        type:     'string',
        default:  '',
        describe: 'Code file to test'
      })
      .example(chalk.yellow('leetcode test 1.two-sum.cpp'), 'Test code with default test case')
      .example(chalk.yellow('leetcode test 1.two-sum.cpp -t "[1,2,3]\\n4"'), 'Test code with customized test case');
  }
};

function printResult(actual, extra, k) {
  if (!actual.hasOwnProperty(k)) return;
  // HACk: leetcode still return 'Accepted' even the answer is wrong!!
  const v = actual[k] || '';
  if (k === 'state' && v === 'Accepted') return;

  let ok = actual.ok;

  const lines = Array.isArray(v) ? v : [v];
  for (let line of lines) {
    const extraInfo = extra ? ` (${extra})` : '';
    if (k !== 'state') line = lodash.startCase(k) + extraInfo + ': ' + line;
    log.info('  ' + h.prettyText(' ' + line, ok));
  }
}

function runTest(argv) {
  if (!file.exist(argv.filename))
    return log.fatal('File ' + argv.filename + ' not exist!');

  const meta = file.meta(argv.filename);

  core.getProblem(meta.id, true, function(e, problem) {
    if (e) return log.fail(e);

    if (!problem.testable)
      return log.fail('not testable? please submit directly!');

    if (argv.testcase)
      problem.testcase = argv.testcase.replace(/\\n/g, '\n');

    if (!problem.testcase)
      return log.fail('missing testcase?');

    problem.file = argv.filename;
    problem.lang = meta.lang;

    core.testProblem(problem, function(e, results) {
      if (e) return log.fail(e);

      results = _.sortBy(results, x => x.type);
      if (results[0].state === 'Accepted')
        results[0].state = 'Finished';
      printResult(results[0], null, 'state');
      printResult(results[0], null, 'error');

      results[0].your_input = problem.testcase;
      results[0].output = results[0].answer;
      // LeetCode-CN returns the actual and expected answer into two separate responses
      if (results[1]) {
        results[0].expected_answer = results[1].answer;
      }
      results[0].stdout = results[0].stdout.slice(1, -1).replace(/\\n/g, '\n');
      printResult(results[0], null, 'your_input');
      printResult(results[0], results[0].runtime, 'output');
      printResult(results[0], null, 'expected_answer');
      printResult(results[0], null, 'stdout');
    });
  });
}

cmd.handler = function(argv) {
  session.argv = argv;
  if (!argv.i)
    return runTest(argv);

  h.readStdin(function(e, data) {
    if (e) return log.fail(e);

    argv.testcase = data;
    return runTest(argv);
  });
};

module.exports = cmd;
