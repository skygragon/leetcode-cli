var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var log = require('loglevel');
var sprintf = require('sprintf-js').sprintf;

var chalk = require('../chalk');
var config = require('../config');
var core = require('../core');
var h = require('../helper');
var icon = require('../icon');

var cmd = {
  command: 'show <keyword>',
  desc:    'show problem by name or index',
  builder: {
    gen: {
      alias:    'g',
      type:     'boolean',
      default:  false,
      describe: 'Generate source file from template'
    },
    lang: {
      alias:    'l',
      type:     'string',
      default:  config.LANG,
      describe: 'Program language to use'
    },
    extra: {
      alias:    'x',
      type:     'boolean',
      default:  false,
      describe: 'Provide extra problem details in generated file'
    },
    desc: {
      alias:    'd',
      type:     'boolean',
      default:  true,
      describe: 'Show problem description'
    },
    template: {
      alias:    't',
      type:     'boolean',
      default:  false,
      describe: 'Show code template'
    }
  }
};

cmd.handler = function(argv) {
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);

    var template = _.find(problem.templates, function(x) {
      return x.value === argv.lang;
    });
    if (!template && (argv.template || argv.gen))
      return log.fail('Unknown language "' + argv.lang + '"');

    var fileinfo = '';
    if (argv.gen) {
      problem.code = template.defaultCode;

      // try to use a new filename to avoid overwrite by mistake
      var filename = problem.id + '.' + problem.key + h.langToExt(argv.lang);
      var i = 0;
      while (fs.existsSync(filename)) {
        filename = problem.id + '.' +
                   problem.key + '.' +
                   (i++) +
                   h.langToExt(argv.lang);
      }

      core.exportProblem(problem, filename, !argv.extra);
      fileinfo = sprintf('(File: %s)', chalk.yellow.underline(filename));
    }

    if (argv.desc) {
      log.info(sprintf('[%d] %s %s\t%s\n',
            problem.id,
            problem.name,
            (problem.starred ? chalk.yellow(icon.like) : ' '),
            fileinfo));
      log.info(sprintf('%s\n', chalk.underline(problem.link)));
      log.info(sprintf('* %s (%.2f%%)', problem.level, problem.percent));
      log.info(sprintf('* Total Accepted:    %d', problem.totalAC));
      log.info(sprintf('* Total Submissions: %d', problem.totalSubmit));
      if (problem.testable && problem.testcase) {
        log.info(sprintf('* Testcase Example:  %s',
              chalk.yellow(util.inspect(problem.testcase))));
      }
      log.info();
      log.info(problem.desc);

      if (argv.template) {
        log.info();
        log.info('Template:');
        log.info();
      }
    }

    if (argv.template) {
      log.info(chalk.yellow(template.defaultCode));
    }
  });
};

module.exports = cmd;
