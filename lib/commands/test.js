var util = require('util');

var _ = require('underscore');
var log = require('loglevel');

var chalk = require('../chalk');
var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'test <filename>',
  desc:    'send solution to leetcode and run test',
  builder: {
    testcase: {
      alias:    't',
      type:     'string',
      default:  '',
      describe: 'Provide test case in command line'
    },
    i: {
      type:     'boolean',
      default:  false,
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

  log.info('    ' + h.prettyText(line, ok));
}

function runTest(argv) {
  // use the 1st section in filename as keyword
  // e.g. two-sum.cpp, or two-sum.78502271.ac.cpp
  var keyword = h.getFilename(argv.filename).split('.')[0];

  core.getProblem(keyword, function(e, problem) {
    if (e) return log.fail(e);

    if (!problem.testable)
      return log.fail('not testable? please submit directly!');

    if (argv.testcase)
      problem.testcase = argv.testcase.replace(/\\n/g, '\n');

    if (!problem.testcase)
      return log.fail('missing testcase?');

    problem.file = argv.filename;

    log.info('\nInput data:');
    log.info(problem.testcase);

    core.testProblem(problem, function(e, results) {
      if (e) return log.fail(e);

      for (var i = 0; i < results.length; ++i) {
        log.info();
        log.info(chalk.yellow(results[i].name));

        prettyLine(results[i], null, 'status_code');
        prettyLine(results[i], null, 'status_runtime');
        prettyLine(results[i], results[i + 1], 'code_answer');
        prettyLine(results[i], results[i + 1], 'code_output');

        // show "xxx_error" message
        _.chain(results[i])
         .pick(function(v, k, obj) {
           return /_error$/.test(k) && v.length > 0;
         })
         .keys()
         .each(function(k) {
           prettyLine(results[i], null, k);
         });
      }
    });
  });
}

cmd.handler = function(argv) {
  if (!argv.i)
    return runTest(argv);

  h.readStdin(function(e, data) {
    if (e) return log.fail(e);

    argv.testcase = data;
    return runTest(argv);
  });
};

module.exports = cmd;
