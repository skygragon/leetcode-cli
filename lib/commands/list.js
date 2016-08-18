var sprintf = require('underscore.string/sprintf');

var cmd = {
  command: 'list [--cached|-c] [--undone|-D]',
  desc: 'List all problems.',
  builder: {
    cached: {
      alias: 'c',
      describe: 'List cached problems.'
    },
    undone: {
      alias: 'D',
      describe: 'List undone problems.'
    }
  }
};

cmd.handler = function(argv) {
  var problems = require('../problems');
  problems.getAll(function(err, items){
    items.forEach(function(item){
      console.log(sprintf('[%3d] %-60s %-6s (%s)',
            item.id, item.name, item.level, item.percent));
    });
  });
}

module.exports = cmd;
