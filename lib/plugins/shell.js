var path = require('path');

var h = require('../helper');
var log = require('../log');
var Plugin = require('../plugin');

var plugin = new Plugin(101, 'shell', '2019.12.02', 'Plugin to exec shell after your code accepted');

plugin.submitProblem = function(problem, cb) {
  var filename = path.basename(problem.file);

  var shellpath = "";
  if (plugin.config.path) {
    shellpath = plugin.config.path;
  }

  plugin.next.submitProblem(problem, function(_e, results) {
    cb(_e, results);
    if (_e || !results[0].ok) return;

    if (shellpath) {
      log.debug('running shell: ' + filename);

      var child_process = require('child_process');
      var stdout = child_process.execFileSync(shellpath, [filename], {
        encoding: 'utf8'
      });
      if (stdout) {
        log.info('  ' + h.prettyText(' Shell Output: ' + stdout, true));
      }
    }
  });
};

module.exports = plugin;