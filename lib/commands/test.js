'use strict';
var fs = require('fs');
var _ = require('underscore');

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

function printResult(actual, expect, k) {
  if (!actual.hasOwnProperty(k)) return;
  // HACk: leetcode still return 'Accepted' even the answer is wrong!!
  const v = actual[k] || '';
  if (k === 'state' && v === 'Accepted') return;

  let ok = actual.ok;
  if (expect && !_.isEqual(actual[k], expect[k])) ok = false;

  const lines = Array.isArray(v) ? v : [v];
  for (let line of lines) {
    if (k !== 'state') line = k + ': ' + line;
    log.info('  ' + h.prettyText(' ' + line, ok));
  }
}

function runTest(argv) {
  if (!fs.existsSync(argv.filename))
    return log.error('File ' + argv.filename + ' not exist!');

  const meta = file.meta(argv.filename);

  core.getProblem(meta.id, function(e, problem) {
    if (e) return log.fail(e);

    if (!problem.testable)
      return log.fail('not testable? please submit directly!');

    if (argv.testcase)
      problem.testcase = argv.testcase.replace(/\\n/g, '\n');

    if (!problem.testcase)
      return log.fail('missing testcase?');

    problem.file = argv.filename;
    problem.lang = meta.lang;

    log.info('\nInput data:');
    log.info(problem.testcase);

    core.testProblem(problem, function(e, results) {
      if (e) return log.fail(e);

      results = _.sortBy(results, x => x.type);
      for (let i = 0; i < results.length; ++i) {
        log.info();
        log.info(chalk.yellow(results[i].type));

        printResult(results[i], null, 'state');
        printResult(results[i], null, 'runtime');
        printResult(results[i], results[i + 1], 'answer');
        printResult(results[i], results[i + 1], 'stdout');
        printResult(results[i], null, 'error');
      }
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
