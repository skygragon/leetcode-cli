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
  aliases: ['view', 'pull'],
  desc:    'Show question',
  builder: {
    c: {
      alias:    'codeonly',
      type:     'boolean',
      default:  false,
      describe: 'Only show code template'
    },
    e: {
      alias:    'editor',
      type:     'string',
      describe: 'Open source code in editor'
    },
    g: {
      alias:    'gen',
      type:     'boolean',
      default:  false,
      describe: 'Generate source code'
    },
    l: {
      alias:    'lang',
      type:     'string',
      default:  config.code.lang,
      describe: 'Programming language of the source code',
      choices:  config.sys.langs
    },
    x: {
      alias:    'extra',
      type:     'boolean',
      default:  false,
      describe: 'Show extra question details in source code'
    }
  }
};

function genFileName(problem, lang) {
  // try to use a new filename to avoid overwrite by mistake
  var name = problem.id + '.' + problem.slug + h.langToExt(lang);
  var i = 0;
  while (fs.existsSync(name))
    name = problem.id + '.' + problem.slug + '.' + (i++) + h.langToExt(lang);
  return name;
}

cmd.handler = function(argv) {
  session.argv = argv;
  core.getProblem(argv.keyword, function(e, problem) {
    if (e) return log.fail(e);

    var langlist = problem.templates
      .map(function(x) { return x.value; })
      .sort()
      .join(', ');

    var code;
    var needcode = argv.gen || argv.codeonly;
    if (needcode) {
      var template = _.find(problem.templates, function(x) {
        return x.value === argv.lang;
      });
      if (!template) {
        log.fail('Not supported language "' + argv.lang + '"');
        log.warn('Supported languages: ' + langlist);
        return;
      }

      var opts = {
        lang: argv.lang,
        code: template.defaultCode,
        tpl:  argv.extra ? 'detailed' : 'codeonly'
      };
      code = core.exportProblem(problem, opts);
    }

    var filename;
    if (argv.gen) {
      filename = genFileName(problem, argv.lang);
      fs.writeFileSync(filename, code);

      if (argv.editor !== undefined) {
        childProcess.spawn(argv.editor || config.code.editor, [filename], {
          // in case your editor of choice is vim or emacs
          stdio: 'inherit'
        });
      }
    } else {
      if (argv.codeonly) {
        log.info(chalk.yellow(code));
        return;
      }
    }

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
    log.printf('* Avail Languages:   %s', langlist);

    log.info();
    log.info(problem.desc);
  });
};

module.exports = cmd;
