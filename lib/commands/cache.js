var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;
var _ = require('underscore');

var cache = require('../cache');
var h = require('../helper');

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
  if (argv.delete === undefined) {
    _.sortBy(cache.list(), function(f) {
      var x = parseInt(f.name.split('.')[0], 10);
      if (_.isNaN(x)) x = 0;
      return x;
    })
    .forEach(function(f) {
      log.info(sprintf('%-50s %8s    %s ago',
            f.name,
            h.prettySize(f.size),
            h.prettyTime(f.mtime)));
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
