var sprintf = require('sprintf-js').sprintf;
var _ = require('underscore');

var config = require('../config');
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
      .option('t', {
        alias:    'tag',
        type:     'string',
        default:  'all',
        describe: 'Show statistics for given tag',
        choices:  ['all'].concat(config.sys.categories)
      })
      .example(chalk.yellow('leetcode stat'), 'Show progress status')
      .example(chalk.yellow('leetcode stat --no-lock'), 'Show progress status without locked questions')
      .example(chalk.yellow('leetcode stat -t algorithms'), 'Show progress status of algorithms questions')
      .example(chalk.yellow('leetcode stat -g'), 'Show detailed status in graph');
  }
};

function bar(c, n) {
  return _.range(n)
    .map(function(i) {
      return c;
    })
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

function showGraph(problems) {
  var icons = {
    ac:    chalk.green(h.isWindows() ? 'O ' : '▣ '),
    notac: chalk.red(h.isWindows() ? 'X ' : '▤ '),
    none:  chalk.gray(h.isWindows() ? 'o ' : '⬚ '),
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
    graph[problem.id] = icons[problem.state] || icons.none;
  });

  var line = [sprintf(' %03d', 0)];
  for (var i = 1, n = graph.length; i <= n; ++i) {
    // padding before group
    if (i % 10 === 1) line.push('   ');

    line.push(graph[i] || icons.empty);

    // time to start new row
    if (i % (10 * groups) === 0 || i === n) {
      log.info(line.join(''));
      line = [sprintf(' %03d', i)];
    }
  }

  log.info();
  log.printf('%7s%s%3s%s%3s%s',
      ' ', icons.ac + chalk.green(' Accepted'),
      ' ', icons.notac + chalk.red(' Not Accepted'),
      ' ', icons.none + ' Remaining');
  log.info();
}

cmd.handler = function(argv) {
  session.argv = argv;
  core.getProblems(function(e, problems) {
    if (e) return log.fail(e);

    if (argv.tag !== 'all') {
      problems = _.filter(problems, function(x) { return x.category === argv.tag; });
    }

    if (!argv.lock) {
      problems = _.filter(problems, function(x) { return !x.locked; });
    }

    if (argv.graph) return showGraph(problems);
    showProgress(problems);
  });
};

module.exports = cmd;
