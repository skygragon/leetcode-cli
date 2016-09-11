var util = require('util');

var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'submit <filename>',
  desc:    'submit final solution to leetcode',
  builder: {
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

      var line = util.format(' %s', h.statusToName(result.status_code));
      console.log('    ' + h.prettyText(line, ok));

      line = util.format(' %d/%d cases passed (%s)',
          result.total_correct,
          result.total_testcases,
          result.status_runtime);
      console.log('    ' + h.prettyText(line, ok));

      if (!ok && runOk) {
        line = util.format(' output:   %s', result.code_output);
        console.log('    ' + h.prettyText(line, ok));

        line = util.format(' expected: %s', result.expected_output);
        console.log('    ' + h.prettyText(line, ok));
      }

      // update this problem status in local cache
      core.updateProblem(problem, {state: (ok ? 'ac' : 'notac')});
    });
  });
};

module.exports = cmd;
