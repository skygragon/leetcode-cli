var util = require('util');

var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'submit <filename>',
  desc:    'Submit solution to leetcode.',
  builder: {
    filename: {
      describe: 'Problem source file name.'
    }
  }
};

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

      if (!ok && runOk) {
        console.log(util.format('input:\n%s', result.input));
      }

      console.log(util.format('    %s %s',
            h.prettyYesNo(ok),
            h.statusToName(result.status_code)));
      console.log(util.format('    %s %d/%d cases passed (%s)',
            h.prettyYesNo(ok),
            result.total_correct,
            result.total_testcases,
            result.status_runtime));

      if (!ok && runOk) {
        console.log(util.format(
              '    ✘ output:   %s', result.code_output));
        console.log(util.format(
              '    ✔ expected: %s', result.expected_output));
      }
    });
  });
};

module.exports = cmd;
