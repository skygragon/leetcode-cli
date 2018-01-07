'use strict';
const fs = require('fs');
const path = require('path');

const assert = require('chai').assert;
const rewire = require('rewire');

const chalk = require('../lib/chalk');
const config = require('../lib/config');
const log = require('../lib/log');

const Plugin = rewire('../lib/plugin');

describe('plugin', function() {
  const noop = () => {};

  before(function() {
    log.init();
    chalk.init();
    config.init();

    const h = rewire('../lib/helper');
    Plugin.__set__('h', h);
    Plugin.__set__('cache', {get: noop});
  });

  function clean() {
    for (let f of fs.readdirSync('./tmp'))
      fs.unlinkSync('./tmp/' + f);
  }
  beforeEach(clean);
  afterEach(clean);

  describe('#Plugin.init', function() {
    const leetcode = new Plugin(0, 'Leetcode', '2.0');
    const cache = new Plugin(1, 'Cache', '1.0');
    const retry = new Plugin(2, 'Retry', '3.0');
    const core = new Plugin(3, 'Core', '4.0');

    before(function() {
      cache.init = leetcode.init = retry.init = core.init = noop;
      Plugin.__get__('h').getCodeDirData = function() {
        return [
          {name: 'cache', data: cache, file: 'cache.js'},
          {name: 'leetcode', data: leetcode, file: '.leetcode.js'},  // disabled
          {name: 'retry', data: retry, file: 'retry.js'},
          {name: 'bad', data: null}
        ];
      };
    });

    it('should init ok', function() {
      assert.deepEqual(Plugin.plugins, []);
      const res = Plugin.init(core);
      assert.equal(res, true);
      assert.deepEqual(Plugin.plugins.length, 3);

      const names = Plugin.plugins.map(p => p.name);
      assert.deepEqual(names, ['Retry', 'Cache', 'Leetcode']);

      assert.equal(core.next, retry);
      assert.equal(retry.next, cache);
      assert.equal(cache.next, null);
      assert.equal(leetcode.next, null);
    });

    it('should find missing ok', function() {
      Plugin.__set__('cache', {
        get: () => {
          return {company: true, solution: true};
        }
      });

      const res = Plugin.init(core);
      assert.equal(res, false);
      assert.deepEqual(Plugin.plugins.length, 5);

      const names = Plugin.plugins.map(p => p.name);
      assert.deepEqual(names, ['Retry', 'Cache', 'Leetcode', 'company', 'solution']);

      assert.equal(core.next, retry);
      assert.equal(retry.next, cache);
      assert.equal(cache.next, null);
      assert.equal(leetcode.next, null);
    });
  }); // #Plugin.init

  describe('#install', function() {
    let expected;
    before(function() {
      const cp = {
        exec: function(cmd, opts, cb) {
          expected = cmd;
          return cb();
        }
      };
      Plugin.__set__('cp', cp);
    });

    it('should install no deps ok', function(done) {
      expected = '';
      const plugin = new Plugin(100, 'test', '2017.12.26', 'desc', []);
      plugin.install(function() {
        assert.equal(expected, '');
        done();
      });
    });

    it('should install deps ok', function(done) {
      const deps = ['a', 'b:linux', 'b:darwin', 'b:win32', 'c:bad', 'd'];
      const plugin = new Plugin(100, 'test', '2017.12.26', 'desc', deps);
      plugin.install(function() {
        assert.equal(expected, 'npm install --save a b d');
        done();
      });
    });
  }); // #install

  describe('#Plugin.copy', function() {
    const src = path.resolve('./tmp/copy.src.js');
    const dst = path.resolve('./tmp/copy.test.js');

    beforeEach(function() {
      Plugin.__get__('h').getPluginFile = () => dst;
    });

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
  }); // #Plugin.copy

  describe('#Plugin.installMissings', function() {
    const PLUGINS = [
      new Plugin(0, '0', 'missing'),
      new Plugin(1, '1', '2018.01.01'),
      new Plugin(2, '2', 'missing'),
    ];
    let expected = [];

    beforeEach(function() {
      Plugin.__get__('h').getPluginFile = x => './tmp/' + x;
      Plugin.install = (name, cb) => {
        expected.push(name);
        return cb(null, PLUGINS[+name]);
      };
    });

    it('should ok', function(done) {
      Plugin.plugins = PLUGINS;
      expected = [];
      Plugin.installMissings(function(e) {
        assert.notExists(e);
        assert.deepEqual(expected, ['0', '2']);
        done();
      });
    });
  }); // #Plugin.installMissings

  describe('#enable', function() {
    const file = path.resolve('./tmp/leetcode.js');
    beforeEach(function() {
      Plugin.__get__('h').getPluginFile = () => file;
    });

    it('should ok', function() {
      const p = new Plugin(0, 'Leetcode', '2.0', '');
      assert.equal(p.enabled, true);

      p.setFile('.leetcode.js');
      fs.writeFileSync(file, '');
      assert.equal(p.enabled, false);
      assert.equal(p.file, '.leetcode.js');

      p.enable(false);
      assert.equal(p.enabled, false);
      assert.equal(p.file, '.leetcode.js');
      p.enable(true);
      assert.equal(p.enabled, true);
      assert.equal(p.file, 'leetcode.js');
    });
  }); // #enable

  describe('#delete', function() {
    it('should ok', function() {
      Plugin.__get__('h').getPluginFile = x => './tmp/' + x;

      const p = new Plugin(0, '0', '2018.01.01');
      p.file = '0.js';
      fs.writeFileSync('./tmp/0.js', '');

      assert.equal(p.deleted, false);
      assert.deepEqual(fs.readdirSync('./tmp'), ['0.js']);
      p.delete();
      assert.equal(p.deleted, true);
      assert.deepEqual(fs.readdirSync('./tmp'), []);
      p.delete();
      assert.equal(p.deleted, true);
      assert.deepEqual(fs.readdirSync('./tmp'), []);
    });
  }); // #delete

  describe('#save', function() {
    it('should ok', function() {
      let data = {};
      Plugin.__get__('cache').get = () => data;
      Plugin.__get__('cache').set = (k, x) => data = x;

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
