'use strict';
var _ = require('underscore');
var sprintf = require('sprintf-js').sprintf;

var h = require('../helper');
var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var core = require('../core');
var session = require('../session');

const cmd = {
  command: 'list [keyword]',
  aliases: ['ls'],
  desc:    'List questions',
  builder: function(yargs) {
    return yargs
      .option('q', core.filters.query)
      .option('s', {
        alias:    'stat',
        type:     'boolean',
        default:  false,
        describe: 'Show statistics of listed questions'
      })
      .option('t', core.filters.tag)
      .option('x', {
        alias:    'extra',
        type:     'boolean',
        default:  false,
        describe: 'Show extra details: category, companies, tags.'
      })
      .positional('keyword', {
        type:     'string',
        default:  '',
        describe: 'Filter questions by keyword'
      })
      .example(chalk.yellow('leetcode list'), 'List all questions')
      .example(chalk.yellow('leetcode list -x'), 'Show extra info of questions, e.g. tags')
      .example('', '')
      .example(chalk.yellow('leetcode list array'), 'List questions that has "array" in name')
      .example(chalk.yellow('leetcode list -q eD'), 'List questions that with easy level and not done')
      .example(chalk.yellow('leetcode list -t google'), 'List questions from Google company (require plugin)')
      .example(chalk.yellow('leetcode list -t stack'), 'List questions realted to stack (require plugin)');
  }
};

cmd.handler = function(argv) {
  session.argv = argv;
  core.filterProblems(argv, function(e, problems) {
    if (e) return log.fail(e);

    const word = argv.keyword.toLowerCase();
    if (word) {
      if (word.endsWith(word.substr(-1).repeat(6))) {
        log.warn('Hmmm...you might need a new keyboard?');
      }
      problems = problems.filter(x => x.name.toLowerCase().includes(word));
    }

    const stat = {};
    for (let x of ['locked', 'starred', 'ac', 'notac', 'None', 'Easy', 'Medium', 'Hard']) stat[x] = 0;

    problems = _.sortBy(problems, x => -x.fid);
    for (let problem of problems) {
      stat[problem.level] = (stat[problem.level] || 0) + 1;
      stat[problem.state] = (stat[problem.state] || 0) + 1;
      if (problem.locked) ++stat.locked;
      if (problem.starred) ++stat.starred;

      log.printf('%s %s %s [%3d] %-60s %-6s (%.2f %%)',
          (problem.starred ? chalk.yellow(icon.like) : icon.empty),
          (problem.locked ? chalk.red(icon.lock) : icon.empty),
          h.prettyState(problem.state),
          problem.fid,
          problem.name,
          h.prettyLevel(sprintf('%-6s', problem.level)),
          problem.percent);

      if (argv.extra) {
        let badges = [problem.category];
        badges = badges.concat(problem.companies || []);
        badges = badges.concat(problem.tags || []);

        let buf = [];
        let len = 0;
        for (let x of badges) {
          if (len + x.length + 3 >= 60) {
            log.printf('%12s%s', ' ', chalk.gray(buf.join(' | ')));
            buf = [];
            len = 0;
          }
          buf.push(x);
          len += x.length + 3;
        }
        if (buf.length > 0)
          log.printf('%12s%s', ' ', chalk.gray(buf.join(' | ')));
      }
    }

    if (argv.stat) {
      log.info();
      log.printf('      Listed: %-9d Locked:  %-9d Starred: %-9d', problems.length, stat.locked, stat.starred);
      log.printf('      Accept: %-9d Not-AC:  %-9d Remain:  %-9d', stat.ac, stat.notac, stat.None);
      log.printf('      Easy:   %-9d Medium:  %-9d Hard:    %-9d', stat.Easy, stat.Medium, stat.Hard);
    }
  });
};

module.exports = cmd;
