var _ = require('underscore');
var chalk = require('chalk');
var util = require('util');

var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'test <filename>',
  desc:    'send solution to leetcode and run test',
  builder: {
    testcase: {
      alias:    't',
      type:     'string',
      describe: 'Provide test case in command line'
    },
    i: {
      type:     'boolean',
      describe: 'Provide test case interactively'
    }
  }
};

function printPretty(actual, expected, key) {
  if (!actual.hasOwnProperty(key))
    return;

  // hack: leetcode will return status_code = 10 even
  // if the answer is not right!
  if (key === 'status_code' && actual[key] === 10)
    return;

  var sym = '✔';

  if (!actual.run_success) {
    sym = '✘';
  } else if (expected && !_.isEqual(actual[key], expected[key])) {
    sym = '✘';
  }

  var line = (key === 'status_code') ?
    util.format('    %s %s', sym, h.statusToName(actual[key])) :
    util.format('    %s %s: %s', sym, key.split('_').pop(), actual[key]);

  var colorLine = (sym === '✔') ? chalk.green(line) : chalk.red(line);
  console.log(colorLine);
}

cmd.handler = function(argv) {
  var testcase = argv.testcase;
  if (argv.i) {
    testcase = h.readStdin();
  }

  if (!testcase || testcase === '')
    return console.log('ERROR: missing testcase?');

  var keyword = h.getFilename(argv.filename);
  core.getProblem(keyword, function(e, problem) {
    if (e) return console.log('ERROR:', e);

    problem.file = argv.filename;
    problem.testcase = testcase.replace('\\n', '\n');

    console.log('\nInput data:');
    console.log(problem.testcase);

    core.testProblem(problem, function(e, results) {
      if (e) return console.log('ERROR:', e);

      for (var i = 0; i < results.length; ++i) {
        console.log();
        console.log(chalk.yellow(results[i].name));

        printPretty(results[i], null, 'status_code');
        printPretty(results[i], null, 'status_runtime');
        printPretty(results[i], results[i + 1], 'code_answer');
        printPretty(results[i], results[i + 1], 'code_output');
        printPretty(results[i], null, 'compile_error');
      }
    });
  });
};

module.exports = cmd;
