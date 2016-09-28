var _ = require('underscore');
var chalk = require('chalk');
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;

var core = require('../core');
var h = require('../helper');

var cmd = {
  command: 'submission <keyword>',
  desc:    'Retrieve earlier submission by name or index',
  builder: {
    // TODO: retrieve all?? That would be very time costing...
  }
};

cmd.handler = function(argv) {
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return console.log('ERROR:', e);

    core.getSubmissions(problem, function(e, submissions) {
      if (e) return console.log('ERROR:', e);

      console.log('Total: %s submissions', chalk.yellow(submissions.length));

      // Find the latest accepted one
      var submission = _.find(submissions, function(x) {
        // TODO: select by lang? or always select the latest one?
        return x.state === 'Accepted';
      });

      if (!submission) {
        console.log('No Accepted found?');
        return;
      }

      core.getSubmission(submission, function(e, submission) {
        if (e) return console.log('ERROR:', e);

        var f = problem.key + '.' + submission.id + h.langToExt(submission.lang);
        fs.writeFileSync(f, submission.code);

        console.log(sprintf('Saved: %s', chalk.yellow.underline(f)));
      });
    });
  });
};

module.exports = cmd;
