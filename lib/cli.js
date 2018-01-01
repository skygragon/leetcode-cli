'use strict';
var _ = require('underscore');

var chalk = require('./chalk');
var cache = require('./cache');
var config = require('./config');
var core = require('./core');
var h = require('./helper');
var icon = require('./icon');
var log = require('./log');
var Plugin = require('./plugin');

// We are expecting a tier configuration like:
// global config < local config < cli params
// Color is a tricky one so we manually handle it here.
function initColor() {
  chalk.enabled = config.color.enable && chalk.enabled;
  chalk.init();
  chalk.setTheme(config.color.theme);
}

function initIcon() {
  icon.init();
  icon.setTheme(config.icon.theme);
}

function initLogLevel() {
  log.init();

  var level = 'INFO';
  if (process.argv.indexOf('-v') >= 0) level = 'DEBUG';
  if (process.argv.indexOf('-vv') >= 0) level = 'TRACE';

  // print HTTP details in TRACE
  if (level === 'TRACE') {
    var request = require('request');
    request.debug = true;

    console.error = _.wrap(console.error, function(func) {
      var args = _.toArray(arguments);
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

var cli = {};

cli.run = function() {
  config.init();
  cache.init();

  initColor();
  initIcon();
  initLogLevel();

  Plugin.init(core);

  process.stdout.on('error', function(e) {
    if (e.code === 'EPIPE') process.exit();
  });

  var yargs = require('yargs');
  h.width = yargs.terminalWidth();
  yargs.commandDir('commands')
    .completion()
    .help('h')
    .alias('h', 'help')
    .version(false)
    .epilog('Seek more help at https://skygragon.github.io/leetcode-cli/commands')
    .wrap(Math.min(h.width, 120))
    .argv;
};

module.exports = cli;
