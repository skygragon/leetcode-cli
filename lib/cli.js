var fs = require('fs');

var _ = require('underscore');

var h = require('./helper');
var chalk = require('./chalk');
var icon = require('./icon');
var log = require('./log');
var config = require('./config');

// We are expecting a tier configuration like:
// global config < local config < cli params
// Color is a tricky one so we manually handle it here.
function setColor() {
  // FIXME: delete this hack when supports-color handles it well.
  if (process.env.TERM_PROGRAM === 'iTerm.app') chalk.use256 = true;

  chalk.enabled = config.USE_COLOR && chalk.enabled;
  chalk.init();
  chalk.setTheme(config.COLOR_THEME);
}

function setIcon() {
  icon.init();
  icon.setTheme(config.ICON_THEME);
}

function setLogLevel() {
  log.init();

  var level = 'INFO';
  if (process.argv.indexOf('-v') >= 0) level = 'DEBUG';
  if (process.argv.indexOf('-vv') >= 0) level = 'TRACE';

  // print HTTP details in TRACE
  if (level === 'TRACE') {
    var request = require('request');
    request.debug = true;

    console.error = _.wrap(console.error, function(func) {
      var args = Array.prototype.slice.call(arguments);
      args.shift();

      // FIXME: hack HTTP request log, hope no one else use it...
      if (args.length > 0 && args[0].indexOf('REQUEST ') === 0) {
        args = args.map(function(arg) {
          return h.printSafeHTTP(arg);
        });
        log.trace.apply(log, args);
      } else {
        log.info.apply(log, args);
      }
    });
  }

  log.setLevel(level);
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
  setColor();
  setIcon();
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
