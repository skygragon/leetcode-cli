'use strict';
var path = require('path');

var _ = require('underscore');

var h = require('../helper');
var file = require('../file');
var chalk = require('../chalk');
var config = require('../config');
var log = require('../log');
var Queue = require('../queue');
var core = require('../core');
var session = require('../session');
var md5 = require('md5');

const cmd = {
    command: 'export [keyword]',
    aliases: ['pulls'],
    desc: 'Download submission code',
    builder: function(yargs) {
        return yargs
            .option('o', {
                alias: 'outdir',
                type: 'string',
                describe: 'Where to save submission code',
                default: '.'
            })
            .positional('keyword', {
                type: 'string',
                default: '',
                describe: 'Download specific question by id'
            })
            .example(chalk.yellow('leetcode export -o mydir'), 'Download all to folder mydir')
            .example(chalk.yellow('leetcode export 1'), 'Download cpp submission of question 1');
    }
};

function doTask(problem, queue, cb) {
    const argv = queue.ctx.argv;

    function onTaskDone(e, msg) {
        // NOTE: msg color means different purpose:
        // - red: error
        // - green: accepted, fresh download
        // - white: existed already, skip download
        log.printf('[%=4s] %-60s %s', problem.fid, problem.name, (e ? chalk.red('ERROR: ' + (e.msg || e)) : msg));
        if (cb) cb(e);
    }

    core.getProblem(problem.fid, function(e, problem) {
        if (e) return cb(e);
        exportSubmissions(problem, argv, onTaskDone);
    });
}

function exportSubmissions(problem, argv, cb) {
    core.getSubmissions(problem, function(e, submissions) {
        if (e) return cb(e);
        if (submissions.length === 0) {
            return cb('No submissions?');
        }

        // get obj list contain required filetype
        submissions = submissions.filter(x => x.status_display === 'Accepted');
        if (submissions.length === 0) {
            return cb(null, "No accepted code");
        }


        const basename = file.fmt(config.file.export, problem);
        const f = path.join(argv.outdir, basename);
        file.mkdir(argv.outdir);

        const data = _.pick(problem,
            "fid",
            "name",
            "slug",
            "link",
            "locked",
            "percent",
            "level",
            "category",
            "companies",
            "tags",
            "desc"
        );
        data.submissions = {};

        for (let i = 0; i < submissions.length; i++) {
            let submission = submissions[i];
            var md5sum = md5(submission.code);
            data.submissions[md5sum] = {
                "timestamp": h.timeformat(submission.timestamp),
                "code": submission.code
            };
        }

        file.write(f, JSON.stringify(data));
        cb(null, chalk.green.underline(f));
    });
}

cmd.handler = function(argv) {
    session.argv = argv;
    const q = new Queue(null, {
        argv: argv
    }, doTask);

    if (argv.keyword) {
        core.getProblem(argv.keyword, function(e, problem) {
            if (e) {
                return log.fail(e);
            }
            if (problem.state === 'ac') {
                q.addTask(problem).run();
            }
        });
        return;
    }
    core.getProblems(function(e, problems) {
        if (e) return log.fail(e);
        problems = problems.filter(x => x.state === 'ac');
        q.addTasks(problems).run();
    });
};

module.exports = cmd;