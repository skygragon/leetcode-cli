var yargs = require('yargs');

yargs.commandDir('commands')
  .help()
  .strict()
  .argv;
