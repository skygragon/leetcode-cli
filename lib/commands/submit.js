var fs = require('fs');
var util = require('util');

var _ = require('underscore');

var h = require('../helper');
var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');

var cmd = {
  command: 'submit <filename>',
  aliases: ['push', 'commit'],
  desc:    'Submit code',
  builder: function(yargs) {
    return yargs
      .positional('filename', {
        type:     'string',
        describe: 'Code file to submit',
        default:  ''
      })
      .example(chalk.yellow('leetcode submit 1.two-sum.cpp'), 'Submit code');
  }
};

function printResult(actual, k) {
  if (!actual.hasOwnProperty(k)) return;

  var v = actual[k] || '';
  var lines = _.isArray(v) ? v : [v];
  lines.forEach(function(line) {
    if (k !== 'state') line = k + ': ' + line;
    log.info('  ' + h.prettyText(' ' + line, actual.ok));
  });
}

function printLine() {
  var args = _.toArray(arguments);
  var actual = args.shift();
  var line = util.format.apply(util, args);
  log.info('  ' + h.prettyText(' ' + line, actual.ok));
}

cmd.handler = function(argv) {
  session.argv = argv;

  if (!fs.existsSync(argv.filename))
    return log.error('File ' + argv.filename + ' not exist!');

  // use the 1st section in filename as keyword
  // e.g. two-sum.cpp, or two-sum.78502271.ac.cpp
  var keyword = h.getFilename(argv.filename).split('.')[0];

  core.getProblem(keyword, function(e, problem) {
    if (e) return log.fail(e);

    problem.file = argv.filename;

    core.submitProblem(problem, function(e, results) {
      if (e) return log.fail(e);

      var result = results[0];

      printResult(result, 'state');
      printLine(result, '%d/%d cases passed (%s)',
          result.passed, result.total, result.runtime);

      // show beat ratio
      if (result.ok) {
        core.getSubmission({id: result.id}, function(e, submission) {
          if (e || !submission || !submission.distributionChart)
            return log.warn('Failed to get submission beat ratio.');

          var lang = submission.distributionChart.lang;
          var scores = submission.distributionChart.distribution;
          var myRuntime = parseFloat(result.runtime);

          var ratio = 0.0;
          scores.forEach(function(score) {
            if (parseFloat(score[0]) > myRuntime)
              ratio += parseFloat(score[1]);
          });

          printLine(result, 'Your runtime beats %d %% of %s submissions',
              ratio.toFixed(2), lang);
        });
      } else {
        printResult(result, 'error');
        printResult(result, 'testcase');
        printResult(result, 'answer');
        printResult(result, 'expected_answer');
      }

      // update this problem status in local cache
      core.updateProblem(problem, {state: (result.ok ? 'ac' : 'notac')});
    });
  });
};

module.exports = cmd;
