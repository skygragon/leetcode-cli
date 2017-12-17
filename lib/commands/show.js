var fs = require('fs');
var util = require('util');

var _ = require('underscore');
var childProcess = require('child_process');

var h = require('../helper');
var chalk = require('../chalk');
var icon = require('../icon');
var log = require('../log');
var config = require('../config');
var core = require('../core');
var session = require('../session');

var cmd = {
  command: 'show [keyword]',
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
      describe: 'Program language to use',
      choices:  config.LANGS
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
    },
    editor: {
      alias:    'e',
      type:     'string',
      describe: 'Pass generated source file to editor'
    }
  }
};

cmd.handler = function(argv) {
  session.argv = argv;
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);

    var template = _.find(problem.templates, function(x) {
      return x.value === argv.lang;
    });
    if (!template && (argv.template || argv.gen))
      return log.fail('Unknown language "' + argv.lang + '"');

    var filename;
    if (argv.gen) {
      // try to use a new filename to avoid overwrite by mistake
      filename = problem.id + '.' + problem.slug + h.langToExt(argv.lang);
      var i = 0;
      while (fs.existsSync(filename))
        filename = problem.id + '.' + problem.slug + '.' + (i++) + h.langToExt(argv.lang);

      var opts = {
        lang: argv.lang,
        code: template.defaultCode,
        tpl:  argv.extra ? 'detailed' : 'codeonly'
      };
      fs.writeFileSync(filename, core.exportProblem(problem, opts));

      if (argv.editor !== undefined) {
        childProcess.spawn(argv.editor || config.EDITOR, [filename], {
          // in case your editor of choice is vim or emacs
          stdio: 'inherit'
        });
      }
    }

    if (argv.desc) {
      log.printf('[%d] %s %s', problem.id, problem.name,
          (problem.starred ? chalk.yellow(icon.like) : icon.none));
      log.info();
      log.info(chalk.underline(problem.link));

      log.info();
      log.printf('* %s', problem.category);
      log.printf('* %s (%.2f%%)', h.prettyLevel(problem.level), problem.percent);

      if (filename)
        log.printf('* Source Code:       %s', chalk.yellow.underline(filename));
      if (problem.totalAC)
        log.printf('* Total Accepted:    %s', problem.totalAC);
      if (problem.totalSubmit)
        log.printf('* Total Submissions: %s', problem.totalSubmit);
      if (problem.testable && problem.testcase)
        log.printf('* Testcase Example:  %s', chalk.yellow(util.inspect(problem.testcase)));

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
