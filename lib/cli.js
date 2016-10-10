var fs = require('fs');

var chalk = require('chalk');
var log = require('loglevel');

var config = require('./config');
var h = require('./helper');

// We are expecting a tier configuration like:
// global config < local config < cli params
// Color is a tricky one so we manually handle it here.
function setColorMode() {
  var useColor = config.USE_COLOR || false;
  if (process.argv.indexOf('--color') >= 0) useColor = true;
  if (process.argv.indexOf('--no-color') >= 0) useColor = false;

  chalk.enabled = useColor;
}

function setLogLevel() {
  var level = log.levels.INFO;
  if (process.argv.indexOf('-v') >= 0) level = log.levels.DEBUG;
  if (process.argv.indexOf('-vv') >= 0) level = log.levels.TRACE;

  log.setLevel(level);

  log.fail = function(msg) {
    log.error(chalk.red('ERROR: ' + msg));
  };
}

function checkCache() {
  var cacheDir = h.getCacheDir();

  if (!fs.existsSync(cacheDir))
    fs.mkdirSync(cacheDir);
}

var cli = {};

cli.run = function() {
  config.init();

  checkCache();
  setColorMode();
  setLogLevel();

  require('yargs')
    .commandDir('commands')
    .completion()
    .help()
    .strict()
    .argv;
};

module.exports = cli;
