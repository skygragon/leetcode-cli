var sprintf = require('sprintf-js').sprintf,
    _ = require('underscore');

var core = require('../core'),
    h = require('../helper');

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
  core.getProblems(function(e, problems){
    if (e) return console.log('ERROR:', e);

    if (argv.undone) {
      problems = _.filter(problems, function(x){
        return x.state != 'ac';
      });
    }

    problems.forEach(function(problem){
      console.log(sprintf('%s [%3d] %-60s %-6s (%s)',
            h.prettyState(problem.state), problem.id,
            problem.name, problem.level, problem.percent));
    });
  });
}

module.exports = cmd;
