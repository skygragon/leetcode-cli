var cmd = {
  command: 'update [--cached|-c] [--all|-a]',
  desc:    'Update problems list from leetcode.',
  builder: {
    all: {
      alias:    'a',
      describe: 'Update all problems. (slow!)'
    },
    cached: {
      alias:    'c',
      describe: 'Also update those cached problems.'
    }
  }
};

cmd.handler = function(argv) {
  // TODO
  console.log(argv);
};

module.exports = cmd;
