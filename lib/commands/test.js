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

function prettyLine(actual, expected, key) {
  if (!actual.hasOwnProperty(key))
    return;

  // hack: leetcode will return status_code = 10 even
  // if the answer is not right!
  if (key === 'status_code' && actual[key] === 10)
    return;

  var ok = true;

  if (!actual.run_success) {
    ok = false;
  } else if (expected && !_.isEqual(actual[key], expected[key])) {
    ok = false;
  }

  var line = (key === 'status_code') ?
    util.format(' %s', h.statusToName(actual[key])) :
    util.format(' %s: %s', key.split('_').pop(), actual[key]);

  console.log('    ' + h.prettyText(line, ok));
}

cmd.handler = function(argv) {
  var testcase = argv.testcase;
  if (argv.i) {
    testcase = h.readStdin();
  }

  var keyword = h.getFilename(argv.filename);
  core.getProblem(keyword, function(e, problem) {
    if (e) return console.log('ERROR:', e);

    if (testcase !== undefined)
      problem.testcase = testcase.replace(/\\n/g, '\n');

    if (!problem.testcase)
      return console.log('ERROR: missing testcase?');

    problem.file = argv.filename;

    console.log('\nInput data:');
    console.log(problem.testcase);

    core.testProblem(problem, function(e, results) {
      if (e) return console.log('ERROR:', e);

      for (var i = 0; i < results.length; ++i) {
        console.log();
        console.log(chalk.yellow(results[i].name));

        prettyLine(results[i], null, 'status_code');
        prettyLine(results[i], null, 'status_runtime');
        prettyLine(results[i], results[i + 1], 'code_answer');
        prettyLine(results[i], results[i + 1], 'code_output');
        prettyLine(results[i], null, 'compile_error');
      }
    });
  });
};

module.exports = cmd;
