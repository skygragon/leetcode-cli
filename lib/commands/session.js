'use strict';
var prompt = require('prompt');

var h = require('../helper');
var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');
var sprintf = require('../sprintf');

const cmd = {
  command: 'session [keyword]',
  aliases: ['branch'],
  desc:    'Manage sessions',
  builder: function(yargs) {
    return yargs
      .option('c', {
        alias:    'create',
        type:     'boolean',
        describe: 'Create session',
        default:  false
      })
      .option('d', {
        alias:    'delete',
        type:     'boolean',
        describe: 'Delete session',
        default:  false
      })
      .option('e', {
        alias:    'enable',
        type:     'boolean',
        describe: 'Enable/activate session',
        default:  false
      })
      .positional('keyword', {
        type:     'string',
        describe: 'Session name or id',
        default:  ''
      })
      .example(chalk.yellow('leetcode session'), 'Show all cache')
      .example(chalk.yellow('leetcode session xxx'), 'Show session by keyword')
      .example('', '')
      .example(chalk.yellow('leetcode session -c xxx'), 'Create session with name')
      .example(chalk.yellow('leetcode session -e xxx'), 'Enable session by keyword')
      .example(chalk.yellow('leetcode session -d xxx'), 'Delete session by keyword');
  }
};

function printSessions(e, sessions) {
  if (e) return log.fail(e);

  log.info(chalk.gray(sprintf(' %6s %5s %18s %28s %16s',
    'Active', 'Id', 'Name', 'AC Questions', 'AC Submits')));
  log.info(chalk.gray('-'.repeat(80)));

  for (let s of sessions) {
    let questionRate = 0;
    let submissionRate = 0;
    if (s.submitted_questions > 0)
      questionRate = s.ac_questions * 100 / s.submitted_questions;
    if (s.total_submitted > 0)
      submissionRate = s.total_acs * 100 / s.total_submitted;

    log.printf('   %s   %8s   %-26s %6s (%6s %%) %6s (%6s %%)',
      s.is_active ? h.prettyState('ac') : ' ',
      s.id,
      s.name || 'Anonymous Session',
      chalk.green(s.ac_questions),
      questionRate.toFixed(2),
      chalk.green(s.total_acs),
      submissionRate.toFixed(2));
  }
}

cmd.handler = function(argv) {
  session.argv = argv;

  if (argv.create)
    return core.createSession(argv.keyword, printSessions);

  core.getSessions(function(e, sessions) {
    if (e) return log.fail(e);

    if (argv.keyword) {
      const id = Number(argv.keyword);
      sessions = sessions.filter(x => x.name === argv.keyword || x.id === id);
      if (sessions.length > 1) return log.fail('Ambiguous sessions?');

      const session = sessions[0];
      if (!session) return log.fail('Session not found!');

      if (argv.enable && !session.is_active) {
        core.activateSession(session, function(e, sessions) {
          if (e) return log.fail(e);
          require('../session').deleteCodingSession();
          printSessions(e, sessions);
        });
        return;
      }

      if (argv.delete) {
        return core.deleteSession(session, printSessions);
      }
    }
    printSessions(null, sessions);
  });
};

module.exports = cmd;
