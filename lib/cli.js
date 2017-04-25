var fs = require('fs');

var log = require('loglevel');

var chalk = require('./chalk');
var config = require('./config');

// We are expecting a tier configuration like:
// global config < local config < cli params
// Color is a tricky one so we manually handle it here.
function setColorMode() {
  var useColor = config.USE_COLOR || false;
  if (process.argv.indexOf('--color') >= 0) useColor = true;
  if (process.argv.indexOf('--no-color') >= 0) useColor = false;

  chalk.enabled = useColor;
  chalk.setTheme(config.COLOR_THEME);
}

function setLogLevel() {
  var level = log.levels.INFO;
  if (process.argv.indexOf('-v') >= 0) level = log.levels.DEBUG;
  if (process.argv.indexOf('-vv') >= 0) level = log.levels.TRACE;

  log.setLevel(level);

  log.fail = function(e) {
    log.error(chalk.red('ERROR: ' + (e.msg || e)));
  };
}

function checkCache() {
  var h = require('./helper');
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

  process.stdout.on('error', function(e) {
    if (e.code === 'EPIPE') process.exit();
  });

  require('yargs')
    .commandDir('commands')
    .completion()
    .help()
    .strict()
    .argv;
};

module.exports = cli;
