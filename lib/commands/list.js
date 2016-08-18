var sprintf = require('sprintf-js').sprintf;

var problems = require('../problems');

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
  problems.getAll(function(err, items){
    if (err)
      return console.log('ERROR:', err);

    items.forEach(function(item){
      console.log(sprintf('[%3d] %-60s %-6s (%s)',
            item.id, item.name, item.level, item.percent));
    });
  });
}

module.exports = cmd;
