'use strict';
const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;
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
    const p1 = new Plugin(0, 'Leetcode', '2.0');
    const p2 = new Plugin(1, 'Cache', '1.0');
    const p3 = new Plugin(2, 'Retry', '3.0');
    const p4 = new Plugin(3, 'Core', '4.0');

    before(function() {
      p1.init = p2.init = p3.init = p4.init = NOOP;
      file.listCodeDir = function() {
        return [
          {name: 'cache', data: p2, file: 'cache.js'},
          {name: 'leetcode', data: p1, file: '.leetcode.js'},  // disabled
          {name: 'retry', data: p3, file: 'retry.js'},
          {name: 'bad', data: null}
        ];
      };
    });

    it('should init ok', function() {
      assert.deepEqual(Plugin.plugins, []);

      const res = Plugin.init(p4);
      assert.equal(res, true);
      assert.deepEqual(Plugin.plugins.length, 3);

      const names = Plugin.plugins.map(p => p.name);
      assert.deepEqual(names, ['Retry', 'Cache', 'Leetcode']);

      assert.equal(p4.next, p3);
      assert.equal(p3.next, p2);
      assert.equal(p2.next, null);
      assert.equal(p1.next, null);
    });

    it('should find missing ok', function() {
      cache.get = () => {
        return {company: true, solution: true};
      };

      const res = Plugin.init(p4);
      assert.equal(res, false);
      assert.deepEqual(Plugin.plugins.length, 5);

      const names = Plugin.plugins.map(p => p.name);
      assert.deepEqual(names, ['Retry', 'Cache', 'Leetcode', 'company', 'solution']);

      assert.equal(p4.next, p3);
      assert.equal(p3.next, p2);
      assert.equal(p2.next, null);
      assert.equal(p1.next, null);
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
        assert.equal(expected, '');
        done();
      });
    });

    it('should install deps ok', function(done) {
      const deps = ['a', 'b:linux', 'b:darwin', 'b:win32', 'c:bad', 'd'];
      const p = new Plugin(100, 'test', '2017.12.26', 'desc', deps);
      p.install(function() {
        assert.equal(expected, 'npm install --save a b d');
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
        assert.equal(e, 'HTTP Error: 404');
        assert.equal(fs.existsSync(DST), false);
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

      Plugin.install(SRC, function(e, p) {
        assert.notExists(e);
        assert.equal(p.x, 123);
        assert.equal(fs.existsSync(DST), true);
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
        assert.notExists(e);
        assert.deepEqual(expected, ['0', '2']);
        done();
      });
    });
  }); // #Plugin.installMissings

  describe('#enable', function() {
    const FILE = path.resolve(th.DIR, 'leetcode.js');

    before(function() {
      file.pluginFile = () => FILE;
    });

    it('should ok', function() {
      const p = new Plugin(0, 'Leetcode', '2.0', '');
      assert.equal(p.enabled, true);

      p.setFile('.leetcode.js');
      fs.writeFileSync(FILE, '');
      assert.equal(p.enabled, false);
      assert.equal(p.file, '.leetcode.js');
      p.enable(false);
      assert.equal(p.enabled, false);
      assert.equal(p.file, '.leetcode.js');
      p.enable(true);
      assert.equal(p.enabled, true);
      assert.equal(p.file, 'leetcode.js');
      p.enable(false);
      assert.equal(p.enabled, false);
      assert.equal(p.file, '.leetcode.js');
    });
  }); // #enable

  describe('#delete', function() {
    it('should ok', function() {
      file.pluginFile = x => th.DIR + x;

      const p = new Plugin(0, '0', '2018.01.01');
      p.file = '0.js';
      fs.writeFileSync('./tmp/0.js', '');

      assert.equal(p.deleted, false);
      assert.deepEqual(fs.readdirSync(th.DIR), ['0.js']);
      p.delete();
      assert.equal(p.deleted, true);
      assert.deepEqual(fs.readdirSync(th.DIR), []);
      p.delete();
      assert.equal(p.deleted, true);
      assert.deepEqual(fs.readdirSync(th.DIR), []);
    });
  }); // #delete

  describe('#save', function() {
    it('should ok', function() {
      let data = {};
      cache.get = () => data;
      cache.set = (k, x) => data = x;

      const p = new Plugin(0, '0', '2018.01.01');
      p.save();
      assert.deepEqual(data, {'0': true});

      p.enabled = false;
      p.save();
      assert.deepEqual(data, {'0': false});

      p.deleted = true;
      p.save();
      assert.deepEqual(data, {});
    });
  }); // #save
});
