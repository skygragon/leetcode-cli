'use strict';
var path = require('path');

var assert = require('chai').assert;

var chalk = require('../lib/chalk');
var h = require('../lib/helper');

chalk.init();

describe('helper', function() {
  describe('#prettyState', function() {
    it('should ok w/ color', function() {
      chalk.enabled = true;

      assert.equal(h.prettyState('ac'), chalk.green('✔'));
      assert.equal(h.prettyState('notac'), chalk.red('✘'));
      assert.equal(h.prettyState('none'), ' ');
      assert.equal(h.prettyState(''), ' ');
      assert.equal(h.prettyState(null), ' ');
    });

    it('should ok w/o color', function() {
      chalk.enabled = false;

      assert.equal(h.prettyState('ac'), '✔');
      assert.equal(h.prettyState('notac'), '✘');
      assert.equal(h.prettyState('none'), ' ');
      assert.equal(h.prettyState(''), ' ');
      assert.equal(h.prettyState(null), ' ');
    });
  }); // #prettyState

  describe('#prettyText', function() {
    it('should ok w/ color', function() {
      chalk.enabled = true;

      assert.equal(h.prettyText(' text', true), chalk.green('✔ text'));
      assert.equal(h.prettyText(' text', false), chalk.red('✘ text'));
      assert.equal(h.prettyText('text'), 'text');
    });

    it('should ok w/o color', function() {
      chalk.enabled = false;

      assert.equal(h.prettyText(' text', true), '✔ text');
      assert.equal(h.prettyText(' text', false), '✘ text');
      assert.equal(h.prettyText('text'), 'text');
    });
  }); // #prettyText

  describe('#prettyLevel', function() {
    it('should ok w/ color', function() {
      chalk.enabled = true;

      assert.equal(h.prettyLevel('Easy'), chalk.green('Easy'));
      assert.equal(h.prettyLevel('Medium'), chalk.yellow('Medium'));
      assert.equal(h.prettyLevel('Hard'), chalk.red('Hard'));
      assert.equal(h.prettyLevel('easy  '), chalk.green('easy  '));
      assert.equal(h.prettyLevel('medium'), chalk.yellow('medium'));
      assert.equal(h.prettyLevel('hard  '), chalk.red('hard  '));
      assert.equal(h.prettyLevel('unknown'), 'unknown');
    });
  }); // #prettyLevel

  describe('#prettySize', function() {
    it('should ok', function() {
      assert.equal(h.prettySize(0), '0.00B');
      assert.equal(h.prettySize(512), '512.00B');
      assert.equal(h.prettySize(1024), '1.00K');
      assert.equal(h.prettySize(1024 * 1024), '1.00M');
      assert.equal(h.prettySize(1024 * 1024 * 1024), '1.00G');
    });
  }); // #prettySize

  describe('#prettyTime', function() {
    it('should ok', function() {
      assert.equal(h.prettyTime(30), '30 seconds');
      assert.equal(h.prettyTime(60), '1 minutes');
      assert.equal(h.prettyTime(2400), '40 minutes');
      assert.equal(h.prettyTime(3600), '1 hours');
      assert.equal(h.prettyTime(7200), '2 hours');
      assert.equal(h.prettyTime(86400), '1 days');
      assert.equal(h.prettyTime(86400 * 3), '3 days');
      assert.equal(h.prettyTime(86400 * 7), '1 weeks');
    });
  }); // #prettyTime

  describe('#levelToName', function() {
    it('should ok', function() {
      assert.equal(h.levelToName(0), ' ');
      assert.equal(h.levelToName(1), 'Easy');
      assert.equal(h.levelToName(2), 'Medium');
      assert.equal(h.levelToName(3), 'Hard');
      assert.equal(h.levelToName(4), ' ');
    });
  }); // #levelToName

  describe('#statusToName', function() {
    it('should ok', function() {
      assert.equal(h.statusToName(10), 'Accepted');
      assert.equal(h.statusToName(11), 'Wrong Answer');
      assert.equal(h.statusToName(12), 'Memory Limit Exceeded');
      assert.equal(h.statusToName(13), 'Output Limit Exceeded');
      assert.equal(h.statusToName(14), 'Time Limit Exceeded');
      assert.equal(h.statusToName(15), 'Runtime Error');
      assert.equal(h.statusToName(16), 'Internal Error');
      assert.equal(h.statusToName(20), 'Compile Error');
      assert.equal(h.statusToName(21), 'Unknown Error');
      assert.equal(h.statusToName(99), 'Unknown');
    });
  }); // #statusToName

  describe('#langToExt', function() {
    it('should ok', function() {
      assert.equal(h.langToExt('bash'), '.sh');
      assert.equal(h.langToExt('c'), '.c');
      assert.equal(h.langToExt('cpp'), '.cpp');
      assert.equal(h.langToExt('csharp'), '.cs');
      assert.equal(h.langToExt('golang'), '.go');
      assert.equal(h.langToExt('java'), '.java');
      assert.equal(h.langToExt('javascript'), '.js');
      assert.equal(h.langToExt('mysql'), '.sql');
      assert.equal(h.langToExt('python'), '.py');
      assert.equal(h.langToExt('python3'), '.python3.py');
      assert.equal(h.langToExt('ruby'), '.rb');
      assert.equal(h.langToExt('scala'), '.scala');
      assert.equal(h.langToExt('swift'), '.swift');
      assert.equal(h.langToExt('rust'), '.raw');
    });
  }); // #langToExt

  describe('#extToLang', function() {
    it('should ok', function() {
      assert.equal(h.extToLang('/usr/bin/file.sh'), 'bash');
      assert.equal(h.extToLang('/home/skygragon/file.c'), 'c');
      assert.equal(h.extToLang('/var/log/file.cpp'), 'cpp');
      assert.equal(h.extToLang('./file.cs'), 'csharp');
      assert.equal(h.extToLang('../file.go'), 'golang');
      assert.equal(h.extToLang('file.java'), 'java');
      assert.equal(h.extToLang('c:/file.js'), 'javascript');
      assert.equal(h.extToLang('c:/Users/skygragon/file.py'), 'python');
      assert.equal(h.extToLang('c:/Users/skygragon/file.py3'), 'python3');
      assert.equal(h.extToLang('c:/Users/skygragon/file.python3.py'), 'python3');
      assert.equal(h.extToLang('~/file.rb'), 'ruby');
      assert.equal(h.extToLang('/tmp/file.scala'), 'scala');
      assert.equal(h.extToLang('~/leetcode/file.swift'), 'swift');
      assert.equal(h.extToLang('~/leetcode/../file.sql'), 'mysql');
      assert.equal(h.extToLang('/home/skygragon/file.dat'), 'unknown');
    });
  }); // #extToLang

  describe('#langToCommentStyle', function() {
    it('should ok', function() {
      var C_STYLE = {start: '/*', line: ' *', end: ' */'};
      var RUBY_STYLE = {start: '#', line: '#', end: '#'};

      assert.deepEqual(h.langToCommentStyle('bash'), RUBY_STYLE);
      assert.deepEqual(h.langToCommentStyle('c'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('cpp'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('csharp'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('golang'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('java'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('javascript'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('mysql'), RUBY_STYLE);
      assert.deepEqual(h.langToCommentStyle('python'), RUBY_STYLE);
      assert.deepEqual(h.langToCommentStyle('python3'), RUBY_STYLE);
      assert.deepEqual(h.langToCommentStyle('ruby'), RUBY_STYLE);
      assert.deepEqual(h.langToCommentStyle('scala'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('swift'), C_STYLE);
    });
  }); // #langToCommentStyle

  describe('#dirAndFiles', function() {
    var root = path.join(__dirname, '..');

    it('should ok', function() {
      process.env.HOME = '/home/skygragon';

      assert.equal(h.getUserHomeDir(), '/home/skygragon');
      assert.equal(h.getHomeDir(), '/home/skygragon/.lc');
      assert.equal(h.getCacheDir(), '/home/skygragon/.lc/cache');
      assert.equal(h.getCacheFile('xxx'), '/home/skygragon/.lc/cache/xxx.json');
      assert.equal(h.getConfigFile(), '/home/skygragon/.lc/config.json');
      assert.equal(h.getFilename('/home/skygragon/.lc/cache/xxx.json'), 'xxx');

      process.env.HOME = '';
      process.env.USERPROFILE = 'C:\\Users\\skygragon';
      assert.equal(h.getUserHomeDir(), 'C:\\Users\\skygragon');
    });

    it('should getCodeDir ok', function() {
      assert.equal(h.getCodeDir(), root);
      assert.equal(h.getCodeDir('.'), root);
      assert.equal(h.getCodeDir('icons'), path.join(root, 'icons'));
      assert.equal(h.getCodeDir('lib/plugins'), path.join(root, 'lib', 'plugins'));
    });

    it('should getCodeDirData ok', function() {
      var files = h.getCodeDirData('lib/plugins');
      assert.equal(files.length, 3);
      assert.equal(files[0].name, 'cache');
      assert.equal(files[1].name, 'leetcode');
      assert.equal(files[2].name, 'retry');
    });

    it('should getPluginFile ok', function() {
      var expect = path.join(root, 'lib/plugins/cache.js');
      assert.equal(h.getPluginFile('cache.js'), expect);
      assert.equal(h.getPluginFile('./cache.js'), expect);
      assert.equal(h.getPluginFile('https://github.com/skygragon/cache.js'), expect);
    });
  }); // #dirAndFiles

  describe('#getSetCookieValue', function() {
    it('should ok', function() {
      var resp = {
        headers: {'set-cookie': [
          'key1=value1; path=/; Httponly',
          'key2=value2; path=/; Httponly']
        }
      };
      var respNoSetCookie = {
        headers: {}
      };

      assert.equal(h.getSetCookieValue(resp, 'key1'), 'value1');
      assert.equal(h.getSetCookieValue(resp, 'key2'), 'value2');
      assert.equal(h.getSetCookieValue(resp, 'key3'), null);
      assert.equal(h.getSetCookieValue(respNoSetCookie, 'key1'), null);
    });
  }); // #getSetCookieValue

  describe('#printSafeHTTP', function() {
    it('should hide sensitive info', function() {
      var raw = [
        "Cookie: 'xxxxxx'",
        "'X-CSRFToken': 'yyyyyy'",
        "'set-cookie': ['zzzzzz']"
      ].join('\r\n');

      var hide = [
        'Cookie: <hidden>',
        "'X-CSRFToken': <hidden>",
        "'set-cookie': <hidden>"
      ].join('\r\n');

      assert.equal(h.printSafeHTTP(raw), hide);
    });
  }); // #printSafeHTTP

  describe('#readStdin', function() {
    function hijackStdin(data) {
      var stream = require('stream');
      var rs = new stream.Readable();
      rs.push(data);
      rs.push(null);

      Object.defineProperty(process, 'stdin', {value: rs});
    }

    it('should ok', function(done) {
      hijackStdin('[1,2]\n3');

      h.readStdin(function(e, data) {
        assert.equal(data, '[1,2]\n3');
        done();
      });
    });

    it('should ok w/ empty input', function(done) {
      hijackStdin('');

      h.readStdin(function(e, data) {
        assert.equal(data, '');
        done();
      });
    });
  }); // #readStdin
});
