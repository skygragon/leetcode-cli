var _ = require('underscore');
var util = require('util');

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
  var keyword = h.getFilename(argv.filename);
  core.getProblem(keyword, function(e, problem) {
    if (e) return console.log('ERROR:', e);

    problem.file = argv.filename;

    core.submitProblem(problem, function(e, results) {
      if (e) return console.log('ERROR:', e);

      var result = results[0];
      var ok = (result.status_code === 10) &&
        (result.total_correct === result.total_testcases);

      var runOk = result.run_success;

      var line = util.format(' %s', h.statusToName(result.status_code));
      console.log(INDENT + h.prettyText(line, ok));

      // show "xxx_error" message
      _.chain(result)
       .pick(function(v, k, obj) {
         return /_error$/.test(k) && v.length > 0;
       })
       .values()
       .each(function(v) {
         console.log(INDENT + h.prettyText(' ' + v, ok));
       });

      // show success ratio
      line = util.format(' %d/%d cases passed (%s)',
          result.total_correct,
          result.total_testcases,
          result.status_runtime);
      console.log(INDENT + h.prettyText(line, ok));

      // show testcase
      var testcase = result.input || result.last_testcase;
      if (!ok && testcase) {
        line = util.format(' testcase: %s', util.inspect(testcase));
        console.log(INDENT + h.prettyText(line, ok));
      }

      if (!ok && runOk) {
        line = util.format(' output:   %s', result.code_output);
        console.log(INDENT + h.prettyText(line, ok));

        line = util.format(' expected: %s', result.expected_output);
        console.log(INDENT + h.prettyText(line, ok));
      }

      // update this problem status in local cache
      core.updateProblem(problem, {state: (ok ? 'ac' : 'notac')});
    });
  });
};

module.exports = cmd;
