'use strict';
var util = require('util');

var h = require('../helper');
var file = require('../file');
var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');

const cmd = {
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
      .option('s', {
        alias:    'session',
        type:     'string',
        describe: 'Provide session name or id',
        default:  ''
      })
      .example(chalk.yellow('leetcode submit 1.two-sum.cpp'), 'Submit code')
      .example(chalk.yellow('leetcode submit 1.two-sum.cpp -s "cpp-session"'), 'Submit code to the session');

  }
};

function printResult(actual, k) {
  if (!actual.hasOwnProperty(k)) return;

  const v = actual[k] || '';
  const lines = Array.isArray(v) ? v : [v];
  for (let line of lines) {
    if (k !== 'state') line = k + ': ' + line;
    log.info('  ' + h.prettyText(' ' + line, actual.ok));
  }
}

function printLine() {
  const args = Array.from(arguments);
  const actual = args.shift();
  const line = util.format.apply(util, args);
  log.info('  ' + h.prettyText(' ' + line, actual.ok));
}

cmd.handler = function(argv) {
  session.argv = argv;
  if (!file.exist(argv.filename))
    return log.fatal('File ' + argv.filename + ' not exist!');

  const meta = file.meta(argv.filename);
  

  core.getProblem(meta.id, function(e, problem) {
    if (e) return log.fail(e);

    problem.file = argv.filename;
    problem.lang = meta.lang;

    // get current active session
    core.getSessions(function(e, sessions) {
      let restoreSessionNeeded = false;
      let activeSessions = sessions.filter(x => x.is_active == true);
      if  (activeSessions.length > 1) return log.fail('More than one active session');
      const activeSession = activeSessions[0];
      if (argv.session) {
        const id = Number(argv.session);
        sessions = sessions.filter(x => x.name === argv.session || x.id === id);
        if (sessions.length > 1) return log.fail('Ambiguous target sessions?');

        const targetSession = sessions[0];
        if (!targetSession) return log.fail('Target session not found!');

        if (targetSession.id != activeSession.id) {
          // set to target session before submit
          restoreSessionNeeded = true;
          core.activateSession(targetSession, function(e, sessions) {
            if (e) return log.fail(e);
            session.deleteCodingSession();
          });
        }
        printLine(targetSession, 'Submit to session %s', targetSession.name)
      } else {
        printLine(activeSession, 'Submit to session %s', activeSession.name)
      }

      core.submitProblem(problem, function(e, results) {
        if (e) return log.fail(e);

        const result = results[0];

        printResult(result, 'state');
        printLine(result, '%d/%d cases passed (%s)',
            result.passed, result.total, result.runtime);

        if (result.ok) {
          session.updateStat('ac', 1);
          session.updateStat('ac.set', problem.fid);
          core.getSubmission({id: result.id}, function(e, submission) {
            if (e || !submission || !submission.distributionChart)
              return log.warn('Failed to get submission beat ratio.');

            const lang = submission.distributionChart.lang;
            const scores = submission.distributionChart.distribution;
            const myRuntime = parseFloat(result.runtime);

            let ratio = 0.0;
            for (let score of scores) {
              if (parseFloat(score[0]) > myRuntime)
                ratio += parseFloat(score[1]);
            }

            printLine(result, 'Your runtime beats %d %% of %s submissions',
                ratio.toFixed(2), lang);
          });
        } else {
          printResult(result, 'error');
          printResult(result, 'testcase');
          printResult(result, 'answer');
          printResult(result, 'expected_answer');
          printResult(result, 'stdout');
        }

        // update this problem status in local cache
        core.updateProblem(problem, {state: (result.ok ? 'ac' : 'notac')});

        if (restoreSessionNeeded) {
          // reset to previous active session
          core.activateSession(activeSession, function(e, sessions) {
            if (e) return log.fail(e);
            session.deleteCodingSession();
          });
        }
      });
    });
  });
};

module.exports = cmd;
