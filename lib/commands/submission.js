var fs = require('fs');

var _ = require('underscore');
var chalk = require('chalk');
var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;

var core = require('../core');
var h = require('../helper');
var queue = require('../queue');

var cmd = {
  command: 'submission [keyword]',
  desc:    'retrieve earlier submission by name or index',
  builder: {
    all: {
      alias:    'a',
      type:     'boolean',
      default:  false,
      describe: 'Retrieve for all problems'
    },
    outdir: {
      alias:    'o',
      type:     'string',
      describe: 'Where to save the submissions',
      default:  '.'
    }
  }
};

function getSubmissionDone(e, msg, problem, cb) {
  // NOTE: msg color means different purpose:
  // - red: error
  // - green: accepted, fresh download
  // - yellow: not ac-ed, fresh download
  // - white: existed already, skip download
  log.info(sprintf('[%3d] %-60s %s',
        problem.id,
        problem.name,
        (e ? chalk.red('ERROR: ' + e) : msg)
        ));
  if (cb) cb(e);
}

function getSubmission(argv, problem, cb) {
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

    var filename = sprintf('%s/%s.%s.%s%s',
        argv.outdir,
        problem.key,
        submission.id,
        problem.state,
        h.langToExt(submission.lang));

    // skip the existing cached submissions
    if (fs.existsSync(filename)) {
      return done(null, chalk.underline(filename));
    }

    core.getSubmission(submission, function(e, submission) {
      if (e) return done(e);

      fs.writeFileSync(filename, submission.code);

      if (submission.state === 'Accepted')
        done(null, chalk.green.underline(filename));
      else
        done(null, chalk.yellow.underline(filename));
    });
  });
}

cmd.handler = function(argv) {
  var doTask = _.partial(getSubmission, argv, _, _);

  if (argv.all) {
    core.getProblems(function(e, problems) {
      if (e) return log.fail(e);

      problems = problems.filter(function(q) {
        return q.state === 'ac' || q.state === 'notac';
      });

      queue.run(problems, doTask);
    });
    return;
  }

  if (!argv.keyword)
    return log.fail('missing keyword?');

  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);

    queue.run([problem], doTask);
  });
};

module.exports = cmd;
