var yargs = require('yargs');

yargs.commandDir('commands')
  .completion()
  .help()
  .strict()
  .argv;
