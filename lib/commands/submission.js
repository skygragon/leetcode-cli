'use strict';
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;

var h = require('../helper');
var file = require('../file');
var chalk = require('../chalk');
var log = require('../log');
var Queue = require('../queue');
var core = require('../core');
var session = require('../session');

const cmd = {
  command: 'submission [keyword]',
  aliases: ['pull'],
  desc:    'Download submission code',
  builder: function(yargs) {
    return yargs
      .option('a', {
        alias:    'all',
        type:     'boolean',
        default:  false,
        describe: 'Download all questions'
      })
      .option('l', {
        alias:    'lang',
        type:     'string',
        default:  'all',
        describe: 'Filter by programming language'
      })
      .option('o', {
        alias:    'outdir',
        type:     'string',
        describe: 'Where to save submission code',
        default:  '.'
      })
      .option('x', {
        alias:    'extra',
        type:     'boolean',
        default:  false,
        describe: 'Show extra question details in submission code'
      })
      .positional('keyword', {
        type:     'string',
        default:  '',
        describe: 'Download specific question by id'
      })
      .example(chalk.yellow('leetcode submission -a -o mydir'), 'Download all to folder mydir')
      .example(chalk.yellow('leetcode submission -x -a'), 'Add descriptions in the downloaded codes')
      .example(chalk.yellow('leetcode submission -l cpp 1'), 'Download cpp submission of question 1');
  }
};

function doTask(problem, queue, cb) {
  const argv = queue.ctx.argv;

  function onTaskDone(e, msg) {
    // NOTE: msg color means different purpose:
    // - red: error
    // - green: accepted, fresh download
    // - yellow: not ac-ed, fresh download
    // - white: existed already, skip download
    log.printf('[%3d] %-60s %s', problem.fid, problem.name,
        (e ? chalk.red('ERROR: ' + (e.msg || e)) : msg));
    if (cb) cb(e);
  }

  if (argv.extra) {
    // have to get problem details, e.g. problem description.
    core.getProblem(problem.fid, function(e, problem) {
      if (e) return cb(e);
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
    submissions = submissions.filter(x => argv.lang === 'all' || argv.lang === x.lang);
    if (submissions.length === 0)
      return cb('No submissions in required language.');

    // if no accepted, use the latest non-accepted one
    const submission = submissions.find(x => x.status_display === 'Accepted') || submissions[0];
    submission.ac = (submission.status_display === 'Accepted');

    const f = sprintf('%s/%d.%s.%s.%s%s',
        argv.outdir,
        problem.fid,
        problem.slug,
        submission.id,
        submission.ac ? 'ac' : 'notac',
        h.langToExt(submission.lang));

    file.mkdir(argv.outdir);
    // skip the existing cached submissions
    if (fs.existsSync(f))
      return cb(null, chalk.underline(f));

    core.getSubmission(submission, function(e, submission) {
      if (e) return cb(e);

      const opts = {
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
  const q = new Queue(null, {argv: argv}, doTask);

  if (argv.all) {
    core.getProblems(function(e, problems) {
      if (e) return log.fail(e);
      problems = problems.filter(x => x.state === 'ac' || x.state === 'notac');
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
