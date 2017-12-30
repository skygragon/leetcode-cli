var _ = require('underscore');

var h = require('../helper');
var chalk = require('../chalk');
var log = require('../log');
var cache = require('../cache');
var session = require('../session');

var cmd = {
  command: 'cache [keyword]',
  desc:    'Manage local cache',
  builder: function(yargs) {
    return yargs
      .option('d', {
        alias:    'delete',
        type:     'boolean',
        describe: 'Delete cache by keyword',
        default:  false
      })
      .positional('keyword', {
        type:     'string',
        describe: 'Cache name or question id',
        default:  ''
      })
      .example(chalk.yellow('leetcode cache'), 'Show all cache')
      .example(chalk.yellow('leetcode cache 1'), 'Show cache of question 1')
      .example(chalk.yellow('leetcode cache -d'), 'Delete all cache')
      .example(chalk.yellow('leetcode cache 1 -d'), 'Delete cache of question 1');
  }
};

cmd.handler = function(argv) {
  session.argv = argv;

  var caches = cache.list()
    .filter(function(f) {
      return argv.keyword.length === 0 || f.name.startsWith(argv.keyword + '.');
    });

  if (argv.delete) {
    caches.forEach(function(f) { cache.del(f.name); });
  } else {
    _.sortBy(caches, function(f) {
      var x = parseInt(f.name.split('.')[0], 10);
      if (_.isNaN(x)) x = 0;
      return x;
    })
    .forEach(function(f) {
      log.printf('%-80s %8s    %s ago',
          chalk.green(f.name),
          h.prettySize(f.size),
          h.prettyTime((Date.now() - f.mtime) / 1000));
    });
  }
};

module.exports = cmd;
