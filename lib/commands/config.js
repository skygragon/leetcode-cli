var _ = require('underscore');
var nconf = require('nconf');

var h = require('../helper');
var config = require('../config');
var log = require('../log');
var session = require('../session');

var cmd = {
  command: 'config [key] [value]',
  desc:    'show or set configurations',
  builder: {
    all: {
      alias:    'a',
      type:     'boolean',
      describe: 'Show all user configuration',
      default:  false
    },
    delete: {
      alias:    'd',
      type:     'boolean',
      describe: 'Delete configuration',
      default:  false
    }
  }
};

function prettyConfig(cfg) {
  return JSON.stringify(cfg, null, 2);
}

function loadConfig(showall) {
  var cfg = showall ? config.getAll(true) : nconf.get();
  return _.omit(cfg, 'type');
}

function saveConfig() {
  require('fs').writeFileSync(h.getConfigFile(), prettyConfig(loadConfig(false)));
}

cmd.handler = function(argv) {
  session.argv = argv;
  nconf.file('local', h.getConfigFile());

  // show all
  if (argv.key === undefined)
    return log.info(prettyConfig(loadConfig(argv.all)));

  var v = nconf.get(argv.key);

  // delete
  if (argv.delete) {
    if (v === undefined) return log.error('Key not found: ' + argv.key);
    nconf.clear(argv.key);
    return saveConfig();
  }

  // show
  if (argv.value === undefined) {
    if (v === undefined) return log.error('Key not found: ' + argv.key);
    return log.info(prettyConfig(v));
  }

  // set
  if (argv.value === 'true') argv.value = true;
  if (argv.value === 'false') argv.value = false;
  nconf.set(argv.key, argv.value);
  return saveConfig();
};

module.exports = cmd;
