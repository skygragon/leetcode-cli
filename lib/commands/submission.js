var _ = require('underscore');
var chalk = require('chalk');
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;

var core = require('../core');
var h = require('../helper');
var queue = require('../queue');

var cmd = {
  command: 'submission [keyword]',
  desc:    'Retrieve earlier submission by name or index',
  builder: {
    all: {
      alias:    'a',
      type:     'boolean',
      describe: 'Retrieve for all problems'
    }
  }
};

function getSubmissionDone(e, msg, problem, cb) {
  console.log(sprintf('[%3d] %-60s %s',
        problem.id,
        problem.name,
        (e ? chalk.red('ERROR: ' + e) : chalk.yellow.underline(msg))
        ));
  if (cb) cb(e);
}

function getSubmission(problem, cb) {
  var done = _.partial(getSubmissionDone, _, _, problem, cb);

  core.getSubmissions(problem, function(e, submissions) {
    if (e) return done(e);
    if (submissions.length === 0) return done('no submissions?');

    // find the latest accepted one
    var submission = _.find(submissions, function(x) {
      // TODO: select by lang?
      return x.state === 'Accepted';
    });

    // if no accepted, use the latest non-accepted one
    submission = submission || submissions[0];

    core.getSubmission(submission, function(e, submission) {
      if (e) return done(e);

      var f = sprintf('%s.%s.%s%s', problem.key, submission.id,
                      problem.state, h.langToExt(submission.lang));
      fs.writeFileSync(f, submission.code);

      done(null, f);
    });
  });
}

cmd.handler = function(argv) {
  if (argv.all) {
    core.getProblems(function(e, problems) {
      if (e) return console.log('ERROR:', e);

      problems = problems.filter(function(q) {
        return q.state === 'ac';
      });

      queue.run(problems, getSubmission);
    });
    return;
  }

  if (!argv.keyword)
    return console.log('ERROR: missing keyword?');

  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return console.log('ERROR:', e);

    queue.run([problem], getSubmission);
  });
};

module.exports = cmd;
