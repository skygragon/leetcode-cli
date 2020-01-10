'use strict';
var moment = require('moment');
var _ = require('underscore');

var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var core = require('../core');
var session = require('../session');
var sprintf = require('../sprintf');
var h = require('../helper');

const cmd = {
  command: 'stat',
  desc:    'Show statistics',
  aliases: ['stats', 'progress', 'report'],
  builder: function(yargs) {
    return yargs
      .option('c', {
        alias:    'cal',
        type:     'boolean',
        default:  false,
        describe: 'Show calendar statistics'
      })
      .option('g', {
        alias:    'graph',
        type:     'boolean',
        default:  false,
        describe: 'Show graphic statistics'
      })
      .option('l', {
        alias:    'lock',
        type:     'boolean',
        default:  true,
        describe: 'Include locked questions'
      })
      .option('q', core.filters.query)
      .option('t', core.filters.tag)
      .example(chalk.yellow('leetcode stat'), 'Show progress status')
      .example(chalk.yellow('leetcode stat -g'), 'Show detailed status in graph')
      .example(chalk.yellow('leetcode stat -c'), 'Show accepted status in calendar')
      .example('', '')
      .example(chalk.yellow('leetcode stat --no-lock'), 'Show status without locked questions')
      .example(chalk.yellow('leetcode stat -t algorithms'), 'Show status of algorithms questions only')
      .example(chalk.yellow('leetcode stat -q h'), 'Show status of hard questions only');
  }
};

function printLine(key, done, all) {
  const n = 30;
  const percent = (all > 0) ? done / all : 0;
  const x = Math.ceil(n * percent);
  log.printf(' %s\t%3s/%-3s (%6s %%)  %s%s',
    h.prettyLevel(key), done, all,
    (100 * percent).toFixed(2),
    chalk.green('█'.repeat(x)),
    chalk.red('░'.repeat(n - x)));
}

function showProgress(problems) {
  const stats = {
    easy:   {all: 0, ac: 0},
    medium: {all: 0, ac: 0},
    hard:   {all: 0, ac: 0}
  };

  for (let problem of problems) {
    const level = problem.level.toLowerCase();
    const state = problem.state.toLowerCase();

    if (!(level in stats)) continue;
    ++stats[level].all;

    if (!(state in stats[level])) continue;
    ++stats[level][state];
  }

  printLine('Easy', stats.easy.ac, stats.easy.all);
  printLine('Medium', stats.medium.ac, stats.medium.all);
  printLine('Hard', stats.hard.ac, stats.hard.all);
}

function showGraph(problems) {
  const ICONS = {
    ac:    chalk.green(icon.ac),
    notac: chalk.red(icon.notac),
    none:  chalk.gray(icon.none),
    empty: icon.empty
  };

  // row header is 4 bytes
  // each question takes 2 bytes
  // each group has 10 questions, which takes (2*10=20) + 3 paddings
  let groups = Math.floor((h.width - 4) / (3 + 2 * 10));
  if (groups < 1) groups = 1;
  if (groups > 5) groups = 5;

  const header = _.range(groups)
    .map(x => sprintf('%4s%18s', x * 10 + 1, x * 10 + 10))
    .join('');
  log.info('      ' + header);

  const graph = [];
  for (let problem of problems)
    graph[problem.fid] = ICONS[problem.state] || ICONS.none;

  let line = [sprintf(' %04s', 0)];
  for (let i = 1, n = graph.length; i <= n; ++i) {
    // padding before group
    if (i % 10 === 1) line.push(' ');

    line.push(graph[i] || ICONS.empty);

    // time to start new row
    if (i % (10 * groups) === 0 || i === n) {
      log.info(line.join(' '));
      line = [sprintf(' %04s', i)];
    }
  }

  log.info();
  log.printf('%7s%s%3s%s%3s%s',
      ' ', ICONS.ac + chalk.green('  Accepted'),
      ' ', ICONS.notac + chalk.red('  Not Accepted'),
      ' ', ICONS.none + '  Remaining');
}

function showCal(problems) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ICONS = [
    icon.none,
    chalk.white(icon.ac),
    chalk.green(icon.ac),
    chalk.yellow(icon.ac),
    chalk.red(icon.ac)
  ];

  const N_MONTHS = 12;
  const N_WEEKS = 53;
  const N_WEEKDAYS = 7;

  const now = moment();

  const SCORES = {easy: 1, medium: 2, hard: 5};
  function toScore(sum, id) {
    const problem = problems.find(x => x.fid === id);
    if (problem) sum += (SCORES[problem.level.toLowerCase()] || 1);
    return sum;
  }

  // load historical stats
  const graph = [];
  const stats = require('../cache').get(h.KEYS.stat) || {};
  for (let k of _.keys(stats)) {
    const score = (stats[k]['ac.set'] || []).reduce(toScore, 0);
    if (score === 0) continue;

    const d = moment(k, 'YYYY-MM-DD');
    graph[now.diff(d, 'days')] = score;
  }

  // print header
  const buf = Buffer.alloc(120, ' ', 'ascii');
  for (let i = 0; i <= N_MONTHS; ++i) {
    // for day 1 in each month, calculate its column position in graph
    const d = now.clone().subtract(i, 'months').date(1);
    const idx = now.diff(d, 'days');

    const j = (N_WEEKS - idx / N_WEEKDAYS + 1) * 2;
    if (j >= 0) buf.write(MONTHS[d.month()], j);
  }
  log.printf('%7s%s', ' ', buf.toString());

  // print graph
  for (let i = 0; i < N_WEEKDAYS; ++i) {
    const line = [];
    // print day in week
    const idx = (now.day() + i + 1) % N_WEEKDAYS;
    line.push(sprintf('%4s   ', WEEKDAYS[idx]));

    for (let j = 0; j < N_WEEKS; ++j) {
      let idx = (N_WEEKS - j - 1) * N_WEEKDAYS + N_WEEKDAYS - i - 1;
      const d = now.clone().subtract(idx, 'days');

      // map count to icons index:
      // [0] => 0, [1,5] => 1, [6,10] => 2, [11,15] => 3, [16,) => 4
      const count = graph[idx] || 0;
      idx = Math.floor((count - 1) / 5) + 1;
      if (idx > 4) idx = 4;

      let icon = ICONS[idx];
      // use different colors for adjacent months
      if (idx === 0 && d.month() % 2) icon = chalk.gray(icon);
      line.push(icon);
    }
    log.info(line.join(' '));
  }

  log.info();
  log.printf('%8s%s%3s%s%3s%s%3s%s',
    ' ', ICONS[1] + '  1~5',
    ' ', ICONS[2] + '  6~10',
    ' ', ICONS[3] + '  11~15',
    ' ', ICONS[4] + '  16+');
}

cmd.handler = function(argv) {
  session.argv = argv;
  core.filterProblems(argv, function(e, problems) {
    if (e) return log.fail(e);

    if (!argv.lock)
      problems = problems.filter(x => !x.locked);

    log.info();
    if (argv.graph)    showGraph(problems);
    else if (argv.cal) showCal(problems);
    else               showProgress(problems);
    log.info();
  });
};

module.exports = cmd;
