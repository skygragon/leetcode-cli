var sprintf = require('sprintf-js').sprintf;

var core = require('../core');

var cmd = {
  command: 'show <keyword>',
  desc: 'Show problem details.',
  builder: {
    keyword: {
      describe: 'Problem keyword, e.g. name, index, or URI path.'
    }
  }
};

cmd.handler = function(argv) {
  core.getProblem(argv.keyword, function(e, problem){
    if (e) return console.log('ERROR:', e);

    console.log(sprintf('[%d] %s\n', problem.id, problem.name));
    console.log(sprintf('%s\n', problem.link));
    console.log(sprintf('* %s (%s)', problem.level, problem.percent));
    console.log(sprintf('* Total Accepted: %d', problem.total_ac));
    console.log(sprintf('* Total Submissions: %d', problem.total_submit));
    console.log();
    console.log(problem.desc);
  });
}

module.exports = cmd;
