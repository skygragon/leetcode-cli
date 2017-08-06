var _ = require('underscore');

var h = require('../helper');
var chalk = require('../chalk');
var log = require('../log');
var cache = require('../cache');
var session = require('../session');

var cmd = {
  command: 'cache',
  desc:    'show cached problems',
  builder: {
    all: {
      alias:    'a',
      type:     'boolean',
      describe: 'Delete all cached problems',
      default:  false
    },
    delete: {
      alias:    'd',
      type:     'string',
      describe: 'Delete specific cached problem'
    }
  }
};

cmd.handler = function(argv) {
  session.argv = argv;
  if (argv.delete === undefined) {
    _.sortBy(cache.list(), function(f) {
      var x = parseInt(f.name.split('.')[0], 10);
      if (_.isNaN(x)) x = 0;
      return x;
    })
    .forEach(function(f) {
      log.printf('%-50s %8s    %s ago',
          chalk.green(f.name),
          h.prettySize(f.size),
          h.prettyTime((Date.now() - f.mtime) / 1000));
    });
  } else if (argv.all) {
    cache.list().forEach(function(f) {
      if (f.name === '.user') return;
      cache.del(f.name);
    });
  } else {
    cache.del(argv.delete);
  }
};

module.exports = cmd;
