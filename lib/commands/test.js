var _ = require('underscore');
var util = require('util');

var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'test <filename>',
  desc:    'Run test case to leetcode.',
  builder: {
    filename: {
      describe: 'Problem source file name.'
    },
    testcase: {
      alias:    't',
      type:     'string',
      describe: 'Provide test case.'
    },
    i: {
      type:     'boolean',
      describe: 'Provide test case interactively.'
    }
  }
};

function prettyLine(actual, expected, key) {
  var sym = '✔';
  if (!actual.run_success) {
    sym = '✘';
  } else if (expected && key !== 'status_runtime' &&
           !_.isEqual(actual[key], expected[key])) {
    sym = '✘';
  }
  return util.format('    %s %s: %s', sym, key.split('_').pop(), actual[key]);
}

cmd.handler = function(argv) {
  var testcase = argv.testcase;
  if (argv.i) {
    testcase = h.readStdin();
  }

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
        console.log(results[i].name);
        console.log(prettyLine(results[i], results[i + 1], 'status_runtime'));
        console.log(prettyLine(results[i], results[i + 1], 'code_answer'));
        console.log(prettyLine(results[i], results[i + 1], 'code_output'));
      }
    });
  });
};

module.exports = cmd;
