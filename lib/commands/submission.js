var fs = require('fs');

var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var h = require('../helper');
var chalk = require('../chalk');
var log = require('../log');
var Queue = require('../queue');
var core = require('../core');
var session = require('../session');

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
    },
    extra: {
      alias:    'x',
      type:     'boolean',
      default:  false,
      describe: 'Provide extra problem details in submission file'
    },
    lang: {
      alias:    'l',
      type:     'string',
      default:  'all',
      describe: 'Programming language used for previous submission'
    }
  }
};

function doTask(problem, queue, cb) {
  var argv = queue.ctx.argv;

  function onTaskDone(e, msg) {
    // NOTE: msg color means different purpose:
    // - red: error
    // - green: accepted, fresh download
    // - yellow: not ac-ed, fresh download
    // - white: existed already, skip download
    log.printf('[%3d] %-60s %s', problem.id, problem.name,
        (e ? chalk.red('ERROR: ' + (e.msg || e)) : msg));
    if (cb) cb(e);
  }

  if (argv.extra) {
    // have to get problem details, e.g. problem description.
    core.getProblem(problem.id, function(e, problem) {
      if (e) return done(e);
      exportSubmission(problem, argv, onTaskDone);
    });
  } else {
    exportSubmission(problem, argv, onTaskDone);
  }
}

function exportSubmission(problem, argv, cb) {
  core.getSubmissions(problem, function(e, submissions) {
    if (e) return cb(e);
    if (submissions.length === 0)
      return cb('No submissions?');

    // get obj list contain required filetype
    submissions = _.filter(submissions, function(x) {
      return argv.lang === 'all' || argv.lang === x.lang;
    });
    if (submissions.length === 0)
      return cb('No submissions in required language.');

    // if no accepted, use the latest non-accepted one
    var submission = _.find(submissions, function(x) {
      return x.status_display === 'Accepted';
    }) || submissions[0];
    submission.ac = (submission.status_display === 'Accepted');

    var f = sprintf('%s/%d.%s.%s.%s%s',
        argv.outdir,
        problem.id,
        problem.slug,
        submission.id,
        submission.ac ? 'ac' : 'notac',
        h.langToExt(submission.lang));

    h.mkdir(argv.outdir);
    // skip the existing cached submissions
    if (fs.existsSync(f))
      return cb(null, chalk.underline(f));

    core.getSubmission(submission, function(e, submission) {
      if (e) return cb(e);

      var opts = {
        lang: submission.lang,
        code: submission.code,
        tpl:  argv.extra ? 'detailed' : 'codeonly'
      };
      fs.writeFileSync(f, core.exportProblem(problem, opts));
      cb(null, submission.ac ? chalk.green.underline(f)
                             : chalk.yellow.underline(f));
    });
  });
}

cmd.handler = function(argv) {
  session.argv = argv;
  var q = new Queue(null, {argv: argv}, doTask);

  if (argv.all) {
    core.getProblems(function(e, problems) {
      if (e) return log.fail(e);
      problems = problems.filter(function(q) { return q.state === 'ac' || q.state === 'notac'; });
      q.addTasks(problems).run();
    });
    return;
  }

  if (!argv.keyword)
    return log.fail('missing keyword?');

  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);
    q.addTask(problem).run();
  });
};

module.exports = cmd;
