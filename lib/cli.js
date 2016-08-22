// We are expecting a tier configuration like:
// global config < local config < cli params
// Color is a tricky one so we manually handle it here.
function setColorMode() {
  var useColor = require('./config').USE_COLOR || false;
  if (process.argv.indexOf('--color') >= 0) useColor = true;
  if (process.argv.indexOf('--no-color') >= 0) useColor = false;

  require('chalk').enabled = useColor;
}

var cli = {};

cli.run = function() {
  setColorMode();

  require('yargs')
    .commandDir('commands')
    .completion()
    .help()
    .strict()
    .argv;
};

module.exports = cli;
