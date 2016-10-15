var util = require('util');

var _ = require('underscore');
var log = require('loglevel');

var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'submit <filename>',
  desc:    'submit final solution to leetcode',
  builder: {
  }
};

var INDENT = '    ';

cmd.handler = function(argv) {
  // use the 1st section in filename as keyword
  // e.g. two-sum.cpp, or two-sum.78502271.ac.cpp
  var keyword = h.getFilename(argv.filename).split('.')[0];

  core.getProblem(keyword, function(e, problem) {
    if (e) return log.fail(e);

    problem.file = argv.filename;

    core.submitProblem(problem, function(e, results) {
      if (e) return log.fail(e);

      var result = results[0];
      var ok = (result.status_code === 10) &&
        (result.total_correct === result.total_testcases);

      var runOk = result.run_success;

      var line = util.format(' %s', h.statusToName(result.status_code));
      log.info(INDENT + h.prettyText(line, ok));

      // show "xxx_error" message
      _.chain(result)
       .pick(function(v, k, obj) {
         return /_error$/.test(k) && v.length > 0;
       })
       .values()
       .each(function(v) {
         log.info(INDENT + h.prettyText(' ' + v, ok));
       });

      // show success ratio
      line = util.format(' %d/%d cases passed (%s)',
          result.total_correct,
          result.total_testcases,
          result.status_runtime);
      log.info(INDENT + h.prettyText(line, ok));

      // show testcase
      var testcase = result.input || result.last_testcase;
      if (!ok && testcase) {
        line = util.format(' testcase: %s', util.inspect(testcase));
        log.info(INDENT + h.prettyText(line, ok));
      }

      if (!ok && runOk) {
        line = util.format(' output:   %s', result.code_output);
        log.info(INDENT + h.prettyText(line, ok));

        line = util.format(' expected: %s', result.expected_output);
        log.info(INDENT + h.prettyText(line, ok));
      }

      // update this problem status in local cache
      core.updateProblem(problem, {state: (ok ? 'ac' : 'notac')});
    });
  });
};

module.exports = cmd;
