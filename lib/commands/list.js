var cmd = {
  command: 'list [--cached|-c] [--undone|-D]',
  desc: 'List all problems',
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
  // TODO
  console.log(argv);
}

module.exports = cmd;
