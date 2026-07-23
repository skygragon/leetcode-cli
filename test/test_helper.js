'use strict';
const assert = require('assert').strict;
const rewire = require('rewire');
const _ = require('underscore');

const chalk = require('../lib/chalk');

describe('helper', function() {
  let h;

  before(function() {
    chalk.init();
  });

  beforeEach(function() {
    h = rewire('../lib/helper');
  });

  describe('#prettyState', function() {
    it('should ok w/ color', function() {
      chalk.enabled = true;

      assert.strictEqual(h.prettyState('ac'), chalk.green('✔'));
      assert.strictEqual(h.prettyState('notac'), chalk.red('✘'));
      assert.strictEqual(h.prettyState('none'), ' ');
      assert.strictEqual(h.prettyState(''), ' ');
      assert.strictEqual(h.prettyState(null), ' ');
    });

    it('should ok w/o color', function() {
      chalk.enabled = false;

      assert.strictEqual(h.prettyState('ac'), '✔');
      assert.strictEqual(h.prettyState('notac'), '✘');
      assert.strictEqual(h.prettyState('none'), ' ');
      assert.strictEqual(h.prettyState(''), ' ');
      assert.strictEqual(h.prettyState(null), ' ');
    });
  }); // #prettyState

  describe('#prettyText', function() {
    it('should ok w/ color', function() {
      chalk.enabled = true;

      assert.strictEqual(h.prettyText(' text', true), chalk.green('✔ text'));
      assert.strictEqual(h.prettyText(' text', false), chalk.red('✘ text'));
      assert.strictEqual(h.prettyText('text'), 'text');
    });

    it('should ok w/o color', function() {
      chalk.enabled = false;

      assert.strictEqual(h.prettyText(' text', true), '✔ text');
      assert.strictEqual(h.prettyText(' text', false), '✘ text');
      assert.strictEqual(h.prettyText('text'), 'text');
    });
  }); // #prettyText

  describe('#prettyLevel', function() {
    it('should ok w/ color', function() {
      chalk.enabled = true;

      assert.strictEqual(h.prettyLevel('Easy'), chalk.green('Easy'));
      assert.strictEqual(h.prettyLevel('Medium'), chalk.yellow('Medium'));
      assert.strictEqual(h.prettyLevel('Hard'), chalk.red('Hard'));
      assert.strictEqual(h.prettyLevel('easy  '), chalk.green('easy  '));
      assert.strictEqual(h.prettyLevel('medium'), chalk.yellow('medium'));
      assert.strictEqual(h.prettyLevel('hard  '), chalk.red('hard  '));
      assert.strictEqual(h.prettyLevel('unknown'), 'unknown');
    });
  }); // #prettyLevel

  describe('#prettySize', function() {
    it('should ok', function() {
      assert.strictEqual(h.prettySize(0), '0.00B');
      assert.strictEqual(h.prettySize(512), '512.00B');
      assert.strictEqual(h.prettySize(1024), '1.00K');
      assert.strictEqual(h.prettySize(1024 * 1024), '1.00M');
      assert.strictEqual(h.prettySize(1024 * 1024 * 1024), '1.00G');
    });
  }); // #prettySize

  describe('#prettyTime', function() {
    it('should ok', function() {
      assert.strictEqual(h.prettyTime(30), '30 seconds');
      assert.strictEqual(h.prettyTime(60), '1 minutes');
      assert.strictEqual(h.prettyTime(2400), '40 minutes');
      assert.strictEqual(h.prettyTime(3600), '1 hours');
      assert.strictEqual(h.prettyTime(7200), '2 hours');
      assert.strictEqual(h.prettyTime(86400), '1 days');
      assert.strictEqual(h.prettyTime(86400 * 3), '3 days');
      assert.strictEqual(h.prettyTime(86400 * 7), '1 weeks');
    });
  }); // #prettyTime

  describe('#levelToName', function() {
    it('should ok', function() {
      assert.strictEqual(h.levelToName(0), ' ');
      assert.strictEqual(h.levelToName(1), 'Easy');
      assert.strictEqual(h.levelToName(2), 'Medium');
      assert.strictEqual(h.levelToName(3), 'Hard');
      assert.strictEqual(h.levelToName(4), ' ');
    });
  }); // #levelToName

  describe('#statusToName', function() {
    it('should ok', function() {
      assert.strictEqual(h.statusToName(10), 'Accepted');
      assert.strictEqual(h.statusToName(11), 'Wrong Answer');
      assert.strictEqual(h.statusToName(12), 'Memory Limit Exceeded');
      assert.strictEqual(h.statusToName(13), 'Output Limit Exceeded');
      assert.strictEqual(h.statusToName(14), 'Time Limit Exceeded');
      assert.strictEqual(h.statusToName(15), 'Runtime Error');
      assert.strictEqual(h.statusToName(16), 'Internal Error');
      assert.strictEqual(h.statusToName(20), 'Compile Error');
      assert.strictEqual(h.statusToName(21), 'Unknown Error');
      assert.strictEqual(h.statusToName(99), 'Unknown');
    });
  }); // #statusToName

  describe('#langToExt', function() {
    it('should ok', function() {
      assert.strictEqual(h.langToExt('bash'), '.sh');
      assert.strictEqual(h.langToExt('c'), '.c');
      assert.strictEqual(h.langToExt('cpp'), '.cpp');
      assert.strictEqual(h.langToExt('csharp'), '.cs');
      assert.strictEqual(h.langToExt('golang'), '.go');
      assert.strictEqual(h.langToExt('java'), '.java');
      assert.strictEqual(h.langToExt('javascript'), '.js');
      assert.strictEqual(h.langToExt('mysql'), '.sql');
      assert.strictEqual(h.langToExt('php'), '.php');
      assert.strictEqual(h.langToExt('python'), '.py');
      assert.strictEqual(h.langToExt('python3'), '.py');
      assert.strictEqual(h.langToExt('ruby'), '.rb');
      assert.strictEqual(h.langToExt('rust'), '.rs');
      assert.strictEqual(h.langToExt('scala'), '.scala');
      assert.strictEqual(h.langToExt('swift'), '.swift');
    });
  }); // #langToExt

  describe('#extToLang', function() {
    it('should ok', function() {
      assert.strictEqual(h.extToLang('/usr/bin/file.sh'), 'bash');
      assert.strictEqual(h.extToLang('/home/skygragon/file.c'), 'c');
      assert.strictEqual(h.extToLang('/var/log/file.cpp'), 'cpp');
      assert.strictEqual(h.extToLang('./file.cs'), 'csharp');
      assert.strictEqual(h.extToLang('../file.go'), 'golang');
      assert.strictEqual(h.extToLang('file.java'), 'java');
      assert.strictEqual(h.extToLang('c:/file.js'), 'javascript');
      assert.strictEqual(h.extToLang('~/leetcode/../file.sql'), 'mysql');
      assert.strictEqual(h.extToLang('~/leetcode/hello.php'), 'php');
      assert.strictEqual(h.extToLang('c:/Users/skygragon/file.py'), 'python');
      assert.strictEqual(h.extToLang('~/file.rb'), 'ruby');
      assert.strictEqual(h.extToLang('~/leetcode/file.rs'), 'rust');
      assert.strictEqual(h.extToLang('/tmp/file.scala'), 'scala');
      assert.strictEqual(h.extToLang('~/leetcode/file.swift'), 'swift');
      assert.strictEqual(h.extToLang('/home/skygragon/file.dat'), 'unknown');
    });
  }); // #extToLang

  describe('#langToCommentStyle', function() {
    it('should ok', function() {
      const C_STYLE = {start: '/*', line: ' *', end: ' */'};
      const RUBY_STYLE = {start: '#', line: '#', end: '#'};
      const SQL_STYLE = {start: '--', line: '--', end: '--'};

      assert.deepStrictEqual(h.langToCommentStyle('bash'), RUBY_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('c'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('cpp'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('csharp'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('golang'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('java'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('javascript'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('mysql'), SQL_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('php'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('python'), RUBY_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('python3'), RUBY_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('ruby'), RUBY_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('rust'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('scala'), C_STYLE);
      assert.deepStrictEqual(h.langToCommentStyle('swift'), C_STYLE);
    });
  }); // #langToCommentStyle

  describe('#getSetCookieValue', function() {
    it('should ok', function() {
      const resp = {
        headers: {'set-cookie': [
          'key1=value1; path=/; Httponly',
          'key2=value2; path=/; Httponly']
        }
      };
      const respNoSetCookie = {
        headers: {}
      };

      assert.strictEqual(h.getSetCookieValue(resp, 'key1'), 'value1');
      assert.strictEqual(h.getSetCookieValue(resp, 'key2'), 'value2');
      assert.strictEqual(h.getSetCookieValue(resp, 'key3'), null);
      assert.strictEqual(h.getSetCookieValue(respNoSetCookie, 'key1'), null);
    });
  }); // #getSetCookieValue

  describe('#printSafeHTTP', function() {
    it('should hide sensitive info', function() {
      const raw = [
        "Cookie: 'xxxxxx'",
        "'X-CSRFToken': 'yyyyyy'",
        "'set-cookie': ['zzzzzz']"
      ].join('\r\n');

      const hide = [
        'Cookie: <hidden>',
        "'X-CSRFToken': <hidden>",
        "'set-cookie': <hidden>"
      ].join('\r\n');

      assert.strictEqual(h.printSafeHTTP(raw), hide);
    });
  }); // #printSafeHTTP

  describe('#readStdin', function() {
    function hijackStdin(data) {
      const stream = require('stream');
      const rs = new stream.Readable();
      rs.push(data);
      rs.push(null);

      Object.defineProperty(process, 'stdin', {value: rs});
    }

    it('should ok', function(done) {
      hijackStdin('[1,2]\n3');

      h.readStdin(function(e, data) {
        assert.strictEqual(data, '[1,2]\n3');
        done();
      });
    });

    it('should ok w/ empty input', function(done) {
      hijackStdin('');

      h.readStdin(function(e, data) {
        assert.strictEqual(data, '');
        done();
      });
    });
  }); // #readStdin

  describe('#badge', function() {
    it('should ok', function() {
      chalk.enabled = true;
      assert.strictEqual(h.badge('x'), chalk.white.bgBlue(' x '));
      assert.strictEqual(h.badge('x', 'green'), chalk.black.bgGreen(' x '));
    });

    it('should ok with random', function() {
      const badges = _.values(h.__get__('COLORS'))
        .map(function(x) {
          return chalk[x.fg][x.bg](' random ');
        });

      const i = badges.indexOf(h.badge('random', 'random'));
      assert.strictEqual(i >= 0, true);
    });
  }); // #badge
});
