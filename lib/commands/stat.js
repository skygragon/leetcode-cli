var moment = require('moment');
var sprintf = require('sprintf-js').sprintf;
var _ = require('underscore');

var chalk = require('../chalk');
var log = require('../log');
var core = require('../core');
var session = require('../session');
var h = require('../helper');

var cmd = {
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
      .example(chalk.yellow('leetcode stat --no-lock'), 'Show progress status without locked questions')
      .example(chalk.yellow('leetcode stat -t algorithms'), 'Show progress status of algorithms questions');
  }
};

function bar(c, n) {
  return _.range(n)
    .map(function(i) { return c; })
    .join('');
}

function printLine(key, done, all) {
  var n = 30;
  var percent = (all > 0) ? done / all : 0;
  var x = Math.ceil(n * percent);
  log.printf(' %s\t%3d/%-3d (%.2f%%)  %s%s',
      h.prettyLevel(key), done, all, 100 * percent,
      chalk.green(bar('█', x)),
      chalk.red(bar('░', n - x)));
}

function showProgress(problems) {
  var stats = {
    easy:   {all: 0, ac: 0},
    medium: {all: 0, ac: 0},
    hard:   {all: 0, ac: 0}
  };

  problems.forEach(function(problem) {
    var level = problem.level.toLowerCase();
    var state = problem.state.toLowerCase();

    if (!(level in stats)) return;
    ++stats[level].all;

    if (!(state in stats[level])) return;
    ++stats[level][state];
  });

  printLine('Easy', stats.easy.ac, stats.easy.all);
  printLine('Medium', stats.medium.ac, stats.medium.all);
  printLine('Hard', stats.hard.ac, stats.hard.all);
}

var CHARS = {
  ac:    h.isWindows() ? 'O ' : '▣ ',
  notac: h.isWindows() ? 'X ' : '▤ ',
  none:  h.isWindows() ? 'o ' : '⬚ ',
};

function showGraph(problems) {
  var ICONS = {
    ac:    chalk.green(CHARS.ac),
    notac: chalk.red(CHARS.notac),
    none:  chalk.gray(CHARS.none),
    empty: '  '
  };

  // row header is 4 bytes
  // each question takes 2 bytes
  // each group has 10 questions, which takes (2*10=20) + 3 paddings
  var groups = Math.floor((h.width - 4) / (3 + 2 * 10));
  if (groups < 1) groups = 1;
  if (groups > 5) groups = 5;

  var header = _.range(groups)
    .map(function(x) { return sprintf('%5d%18d', x * 10 + 1, x * 10 + 10); })
    .join('');
  log.info('    ' + header);

  var graph = [];
  _.each(problems, function(problem) {
    graph[problem.id] = ICONS[problem.state] || ICONS.none;
  });

  var line = [sprintf(' %03d', 0)];
  for (var i = 1, n = graph.length; i <= n; ++i) {
    // padding before group
    if (i % 10 === 1) line.push('   ');

    line.push(graph[i] || ICONS.empty);

    // time to start new row
    if (i % (10 * groups) === 0 || i === n) {
      log.info(line.join(''));
      line = [sprintf(' %03d', i)];
    }
  }

  log.info();
  log.printf('%7s%s%3s%s%3s%s',
      ' ', ICONS.ac + chalk.green(' Accepted'),
      ' ', ICONS.notac + chalk.red(' Not Accepted'),
      ' ', ICONS.none + ' Remaining');
}

function showCal() {
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var ICONS = [
    CHARS.none,
    chalk.sprint(CHARS.ac, '#ffffcc'),
    chalk.sprint(CHARS.ac, '#ccff66'),
    chalk.sprint(CHARS.ac, '#66cc33'),
    chalk.sprint(CHARS.ac, '#00ff00')
  ];

  var N_MONTHS = 12;
  var N_WEEKS = 53;
  var N_WEEKDAYS = 7;

  var now = moment();

  // load historical stats
  var graph = [];
  var stats = require('../cache').get(h.KEYS.stat) || {};
  _.keys(stats).forEach(function(k) {
    var v = stats[k].ac || 0;
    if (v === 0) return;

    var d = moment(k, 'YYYY-MM-DD');
    graph[now.diff(d, 'days')] = v;
  });

  // print header
  var buf = Buffer.alloc(120, ' ', 'ascii');
  for (var i = 0; i <= N_MONTHS; ++i) {
    // for day 1 in each month, calculate its column position in graph
    var d = now.clone().subtract(i, 'months').date(1);
    var idx = now.diff(d, 'days');

    var j = (N_WEEKS - idx / N_WEEKDAYS + 1) * 2;
    if (j >= 0) buf.write(MONTHS[d.month()], j);
  }
  log.printf('%7s%s', ' ', buf.toString());

  // print graph
  var idx;
  for (var i = 0; i < N_WEEKDAYS; ++i) {
    var line = [];
    // print day in week
    idx = (now.day() + i + 1) % N_WEEKDAYS;
    line.push(sprintf('%4s   ', WEEKDAYS[idx]));

    for (var j = 0; j < N_WEEKS; ++j) {
      idx = (N_WEEKS - j - 1) * N_WEEKDAYS + N_WEEKDAYS - i - 1;
      var d = now.clone().subtract(idx, 'days');

      // map count to icons index:
      // [0] => 0, [1,5] => 1, [6,10] => 2, [11,15] => 3, [16,) => 4
      var count = graph[idx] || 0;
      idx = Math.floor((count - 1) / 5) + 1;
      if (idx > 4) idx = 4;

      var icon = ICONS[idx];
      // use different colors for adjacent months
      if (idx === 0 && d.month() % 2) icon = chalk.gray(icon);
      line.push(icon);
    }
    log.info(line.join(''));
  }

  log.info();
  log.printf('%7s%s%3s%s%3s%s%3s%s',
    ' ', ICONS[1] + ' 1~5',
    ' ', ICONS[2] + ' 6~10',
    ' ', ICONS[3] + ' 11~15',
    ' ', ICONS[4] + ' 16+');
}

cmd.handler = function(argv) {
  session.argv = argv;
  core.filterProblems(argv, function(e, problems) {
    if (e) return log.fail(e);

    if (!argv.lock)
      problems = _.reject(problems, function(x) { return x.locked; });

    log.info();
    if (argv.graph)    showGraph(problems);
    else if (argv.cal) showCal();
    else               showProgress(problems);
    log.info();
  });
};

module.exports = cmd;
