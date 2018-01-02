'use strict';
const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;
const rewire = require('rewire');

const log = require('../lib/log');
const Plugin = rewire('../lib/plugin');
const h = rewire('../lib/helper');

describe('plugin', function() {
  before(function() {
    log.init();
  });

  describe('#init', function() {
    const leetcode = new Plugin(0, 'Leetcode', '2.0', '');
    const cache = new Plugin(1, 'Cache', '1.0', '');
    const retry = new Plugin(2, 'Retry', '3.0', '');
    const core = new Plugin(3, 'Core', '4.0', '');

    before(function() {
      const noop = function() {};
      cache.init = noop;
      leetcode.init = noop;
      retry.init = noop;
      core.init = noop;

      h.getCodeDirData = function() {
        return [
          {name: 'cache', data: cache},
          {name: '.leetcode', data: leetcode},  // disabled
          {name: 'retry', data: retry},
          {name: 'bad', data: null}
        ];
      };
      Plugin.__set__('h', h);
    });

    it('should init ok', function() {
      assert.deepEqual(Plugin.plugins, []);
      Plugin.init(core);
      assert.deepEqual(Plugin.plugins.length, 3);

      const names = Plugin.plugins.map(p => p.name);
      assert.deepEqual(names, ['Retry', 'Cache', 'Leetcode']);

      assert.equal(core.next, retry);
      assert.equal(retry.next, cache);
      assert.equal(cache.next, null);
      assert.equal(leetcode.next, null);
    });
  }); // #init

  describe('#install', function() {
    let expect;
    before(function() {
      const cp = {
        exec: function(cmd, opts, cb) {
          expect = cmd;
          return cb();
        }
      };
      Plugin.__set__('cp', cp);
    });

    it('should install no deps ok', function(done) {
      expect = '';
      const plugin = new Plugin(100, 'test', '2017.12.26', 'desc', []);
      plugin.install(function() {
        assert.equal(expect, '');
        done();
      });
    });

    it('should install deps ok', function(done) {
      const deps = ['a', 'b:linux', 'b:darwin', 'b:win32', 'c:bad', 'd'];
      const plugin = new Plugin(100, 'test', '2017.12.26', 'desc', deps);
      plugin.install(function() {
        assert.equal(expect, 'npm install --save a b d');
        done();
      });
    });
  }); // #install

  describe('#copy', function() {
    const src = path.resolve('./tmp/copy.src.js');
    const dst = path.resolve('./tmp/copy.test.js');

    function clean() {
      if (fs.existsSync(src)) fs.unlinkSync(src);
      if (fs.existsSync(dst)) fs.unlinkSync(dst);
      h.getPluginFile = function() { return dst; };
    }

    beforeEach(clean);
    after(clean);

    it('should copy from http error', function(done) {
      Plugin.copy('non-exists', function(e, fullpath) {
        assert.equal(e, 'HTTP Error: 404');
        assert.equal(fs.existsSync(dst), false);
        done();
      });
    }).timeout(5000);

    it('should copy from local ok', function(done) {
      const data = [
        'module.exports = {',
        '  x: 123,',
        '  install: function(cb) { cb(); }',
        '};'
      ];
      fs.writeFileSync(src, data.join('\n'));

      Plugin.install(src, function(e, plugin) {
        assert.notExists(e);
        assert.equal(plugin.x, 123);
        assert.equal(fs.existsSync(dst), true);
        done();
      });
    });
  });
});
