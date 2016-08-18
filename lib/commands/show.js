var sprintf = require('sprintf-js').sprintf;

var problems = require('../problems');

var cmd = {
  command: 'show <problem>',
  desc: 'Show problem details.',
  builder: {
    problem: {
      describe: 'Problem name or number.'
    }
  }
};

cmd.handler = function(argv) {
  var k = argv.problem;
  problems.searchOne(k, function(err, item){
    console.log(sprintf('[%d] %s\n', item.id, item.name));
    console.log(sprintf('%s\n', item.link));
    console.log(sprintf('* %s (%s)', item.level, item.percent));
    console.log(sprintf('* Total Accepted: %d', item.total_ac));
    console.log(sprintf('* Total Submissions: %d', item.total_submit));
    console.log();
    console.log(item.desc);
  });
}

module.exports = cmd;
