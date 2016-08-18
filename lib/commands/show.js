var cmd = {
  command: 'show <problem>',
  desc: 'Show problem details',
  builder: {
    problem: {
      describe: 'Problem name or number.'
    }
  }
};

cmd.handler = function(argv) {
  // TODO
  console.log(argv);
}

module.exports = cmd;
