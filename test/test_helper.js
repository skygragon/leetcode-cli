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
      assert.equal(h.langToExt('c'), '.c');
      assert.equal(h.langToExt('cpp'), '.cpp');
      assert.equal(h.langToExt('csharp'), '.cs');
      assert.equal(h.langToExt('golang'), '.go');
      assert.equal(h.langToExt('java'), '.java');
      assert.equal(h.langToExt('javascript'), '.js');
      assert.equal(h.langToExt('python'), '.py');
      assert.equal(h.langToExt('ruby'), '.rb');
      assert.equal(h.langToExt('swift'), '.swift');
      assert.equal(h.langToExt('rust'), '.raw');
    });
  }); // #langToExt

  describe('#extToLang', function() {
    it('should ok', function() {
      assert.equal(h.extToLang('/home/skygragon/file.c'), 'c');
      assert.equal(h.extToLang('/var/log/file.cpp'), 'cpp');
      assert.equal(h.extToLang('./file.cs'), 'csharp');
      assert.equal(h.extToLang('../file.go'), 'golang');
      assert.equal(h.extToLang('file.java'), 'java');
      assert.equal(h.extToLang('c:/file.js'), 'javascript');
      assert.equal(h.extToLang('c:/Users/skygragon/file.py'), 'python');
      assert.equal(h.extToLang('~/file.rb'), 'ruby');
      assert.equal(h.extToLang('~/leetcode/file.swift'), 'swift');
      assert.equal(h.extToLang('/home/skygragon/file.dat'), 'unknown');
    });
  }); // #extToLang

  describe('#langToCommentStyle', function() {
    it('should ok', function() {
      var C_STYLE = {
        commentHeader: '/*',
        commentLine:   ' *',
        commentFooter: ' */'
      };
      var RUBY_STYLE = {
        commentHeader: '#',
        commentLine:   '#',
        commentFooter: '#'
      };

      assert.deepEqual(h.langToCommentStyle('c'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('cpp'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('csharp'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('golang'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('java'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('javascript'), C_STYLE);
      assert.deepEqual(h.langToCommentStyle('python'), RUBY_STYLE);
      assert.deepEqual(h.langToCommentStyle('ruby'), RUBY_STYLE);
      assert.deepEqual(h.langToCommentStyle('swift'), C_STYLE);
    });
  }); // #langToCommentStyle

  describe('#dirAndFiles', function() {
    it('should ok', function() {
      process.env.HOME = '/home/skygragon';

      assert.equal(h.getHomeDir(), '/home/skygragon');
      assert.equal(h.getCacheDir(), '/home/skygragon/.lc');
      assert.equal(h.getCacheFile('xxx'), '/home/skygragon/.lc/xxx.json');
      assert.equal(h.getConfigFile(), '/home/skygragon/.lcconfig');
      assert.equal(h.getFilename('/home/skygragon/.lc/xxx.json'), 'xxx');

      process.env.HOME = '';
      process.env.USERPROFILE = 'C:\\Users\\skygragon';
      assert.equal(h.getHomeDir(), 'C:\\Users\\skygragon');
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
