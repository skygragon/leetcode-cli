'use strict';
const fs = require('fs');
const path = require('path');

const assert = require('assert').strict;
const rewire = require('rewire');

const chalk = require('../lib/chalk');
const config = require('../lib/config');
const log = require('../lib/log');
const th = require('./helper');

const Plugin = rewire('../lib/plugin');

describe('plugin', function() {
  let file;
  let cache;

  const NOOP = () => {};

  before(function() {
    log.init();
    chalk.init();
    config.init();

    file = rewire('../lib/file');
    cache = rewire('../lib/cache');
    Plugin.__set__('file', file);
    Plugin.__set__('cache', cache);
  });

  beforeEach(function() {
    th.clean();
    cache.get = NOOP;
  });

  describe('#Plugin.init', function() {
    const p1 = new Plugin(0, 'leetcode', '2.0');
    const p2 = new Plugin(1, 'cache', '1.0');
    const p3 = new Plugin(2, 'retry', '3.0');
    const p4 = new Plugin(3, 'core', '4.0');

    before(function() {
      p1.init = p2.init = p3.init = p4.init = NOOP;
      file.listCodeDir = function() {
        return [
          {name: 'cache', data: p2, file: 'cache.js'},
          {name: 'leetcode', data: p1, file: 'leetcode.js'},
          {name: 'retry', data: p3, file: 'retry.js'},
          {name: 'bad', data: null}
        ];
      };
    });

    it('should init ok', function() {
      cache.get = () => {
        return {cache: true, leetcode: false, retry: true};
      };
      assert.deepStrictEqual(Plugin.plugins, []);

      const res = Plugin.init(p4);
      assert.strictEqual(res, true);
      assert.deepStrictEqual(Plugin.plugins.length, 3);

      const names = Plugin.plugins.map(p => p.name);
      assert.deepStrictEqual(names, ['retry', 'cache', 'leetcode']);

      assert.strictEqual(p4.next, p3);
      assert.strictEqual(p3.next, p2);
      assert.strictEqual(p2.next, undefined);
      assert.strictEqual(p1.next, undefined);
    });

    it('should find missing ok', function() {
      cache.get = () => {
        return {company: true, leetcode: false, solution: true};
      };

      const res = Plugin.init(p4);
      assert.strictEqual(res, false);
      assert.deepStrictEqual(Plugin.plugins.length, 5);

      const names = Plugin.plugins.map(p => p.name);
      assert.deepStrictEqual(names, ['retry', 'cache', 'leetcode', 'company', 'solution']);

      assert.strictEqual(p4.next, p3);
      assert.strictEqual(p3.next, p2);
      assert.strictEqual(p2.next, undefined);
      assert.strictEqual(p1.next, undefined);
    });
  }); // #Plugin.init

  describe('#install', function() {
    let expected;

    before(function() {
      Plugin.__set__('cp', {
        exec: function(cmd, opts, cb) {
          expected = cmd;
          return cb();
        }
      });
    });

    it('should install no deps ok', function(done) {
      expected = '';
      const p = new Plugin(100, 'test', '2017.12.26', 'desc', []);
      p.install(function() {
        assert.strictEqual(expected, '');
        done();
      });
    });

    it('should install deps ok', function(done) {
      const deps = ['a', 'b:linux', 'b:darwin', 'b:win32', 'c:bad', 'd'];
      const p = new Plugin(100, 'test', '2017.12.26', 'desc', deps);
      p.install(function() {
        assert.strictEqual(expected, 'npm install --save a b d');
        done();
      });
    });
  }); // #install

  describe('#Plugin.copy', function() {
    const SRC = path.resolve(th.DIR, 'copy.src.js');
    const DST = path.resolve(th.DIR, 'copy.test.js');

    before(function() {
      file.pluginFile = () => DST;
    });

    it('should copy from http error', function(done) {
      Plugin.copy('non-exists', function(e, fullpath) {
        assert.strictEqual(e, 'HTTP Error: 404');
        assert.strictEqual(fs.existsSync(DST), false);
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
      fs.writeFileSync(SRC, data.join('\n'));

      Plugin.copy(SRC, function(e, fullpath) {
        assert.ok(!e);
        assert.strictEqual(fullpath, DST);
        assert.strictEqual(fs.existsSync(DST), true);
        done();
      });
    });
  }); // #Plugin.copy

  describe('#Plugin.installMissings', function() {
    const PLUGINS = [
      new Plugin(0, '0', 'missing'),
      new Plugin(1, '1', '2018.01.01'),
      new Plugin(2, '2', 'missing'),
    ];
    let expected;

    beforeEach(function() {
      expected = [];
      file.pluginFile = x => th.DIR + x;
      Plugin.install = (name, cb) => {
        expected.push(name);
        return cb(null, PLUGINS[+name]);
      };
    });

    it('should ok', function(done) {
      Plugin.plugins = PLUGINS;
      Plugin.installMissings(function(e) {
        assert.ok(!e);
        assert.deepStrictEqual(expected, ['0', '2']);
        done();
      });
    });
  }); // #Plugin.installMissings

  describe('#delete', function() {
    it('should ok', function() {
      file.pluginFile = x => th.DIR + x;

      const p = new Plugin(0, '0', '2018.01.01');
      p.file = '0.js';
      fs.writeFileSync('./tmp/0.js', '');

      assert.strictEqual(p.deleted, false);
      assert.deepStrictEqual(fs.readdirSync(th.DIR), ['0.js']);
      p.delete();
      assert.strictEqual(p.deleted, true);
      assert.deepStrictEqual(fs.readdirSync(th.DIR), []);
      p.delete();
      assert.strictEqual(p.deleted, true);
      assert.deepStrictEqual(fs.readdirSync(th.DIR), []);
    });
  }); // #delete

  describe('#save', function() {
    it('should ok', function() {
      let data = {};
      cache.get = () => data;
      cache.set = (k, x) => data = x;

      const p = new Plugin(0, '0', '2018.01.01');
      p.save();
      assert.deepStrictEqual(data, {'0': true});

      p.enabled = false;
      p.save();
      assert.deepStrictEqual(data, {'0': false});

      p.deleted = true;
      p.save();
      assert.deepStrictEqual(data, {});
    });
  }); // #save
});
