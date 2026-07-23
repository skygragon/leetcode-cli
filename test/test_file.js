'use strict';
const fs = require('fs');
const path = require('path');

const assert = require('assert').strict;
const rewire = require('rewire');

const th = require('./helper');

describe('file', function() {
  let file;

  beforeEach(function() {
    file = rewire('../lib/file');
  });

  describe('#dirAndFiles', function() {
    const HOME = path.join(__dirname, '..');

    it('should ok on linux', function() {
      if (file.isWindows()) this.skip();
      process.env.HOME = '/home/skygragon';

      assert.strictEqual(file.userHomeDir(), '/home/skygragon');
      assert.strictEqual(file.homeDir(), '/home/skygragon/.lc');
      assert.strictEqual(file.cacheDir(), '/home/skygragon/.lc/leetcode/cache');
      assert.strictEqual(file.cacheFile('xxx'), '/home/skygragon/.lc/leetcode/cache/xxx.json');
      assert.strictEqual(file.configFile(), '/home/skygragon/.lc/config.json');
      assert.strictEqual(file.name('/home/skygragon/.lc/leetcode/cache/xxx.json'), 'xxx');
    });

    it('should ok on windows', function() {
      if (!file.isWindows()) this.skip();
      process.env.HOME = '';
      process.env.USERPROFILE = 'C:\\Users\\skygragon';
      assert.strictEqual(file.userHomeDir(), 'C:\\Users\\skygragon');
      assert.strictEqual(file.homeDir(), 'C:\\Users\\skygragon\\.lc');
      assert.strictEqual(file.cacheDir(), 'C:\\Users\\skygragon\\.lc\\leetcode\\cache');
      assert.strictEqual(file.cacheFile('xxx'), 'C:\\Users\\skygragon\\.lc\\leetcode\\cache\\xxx.json');
      assert.strictEqual(file.configFile(), 'C:\\Users\\skygragon\\.lc\\config.json');
      assert.strictEqual(file.name('C:\\Users\\skygragon\\.lc\\leetcode\\cache\\xxx.json'), 'xxx');
    });

    it('should codeDir ok', function() {
      assert.strictEqual(file.codeDir(), HOME);
      assert.strictEqual(file.codeDir('.'), HOME);
      assert.strictEqual(file.codeDir('icons'), path.join(HOME, 'icons'));
      assert.strictEqual(file.codeDir('lib/plugins'), path.join(HOME, 'lib', 'plugins'));
    });

    // ignore this test temporarly because it depends on the local file system
    // TODO: revert this test later
    xit('should listCodeDir ok', function() {
      const files = file.listCodeDir('lib/plugins');
      assert.strictEqual(files.length, 3);
      assert.strictEqual(files[0].name, 'cache');
      assert.strictEqual(files[1].name, 'leetcode');
      assert.strictEqual(files[2].name, 'retry');
    });

    it('should pluginFile ok', function() {
      const expect = path.join(HOME, 'lib/plugins/cache.js');
      assert.strictEqual(file.pluginFile('cache.js'), expect);
      assert.strictEqual(file.pluginFile('./cache.js'), expect);
      assert.strictEqual(file.pluginFile('https://github.com/skygragon/cache.js'), expect);
    });

    it('should data ok with missing file', function() {
      assert.strictEqual(file.data('non-exist'), null);
    });
  }); // #dirAndFiles

  describe('#meta', function() {
    it('should meta ok within file content', function() {
      file.data = x => [
        '/ *',
        '  * @lc app=leetcode id=123 lang=javascript',
        '  * /'
      ].join('\n');
      const meta = file.meta('dummy');
      assert.strictEqual(meta.app, 'leetcode')
      assert.strictEqual(meta.id, '123');
      assert.strictEqual(meta.lang, 'javascript');
    });

    it('should meta ok with white space', function() {
      file.data = x => [
        '/ *',
        '  * @lc app=leetcode id=123\t  \t  lang=javascript\r',
        '  * /'
      ].join('\n');
      const meta = file.meta('dummy');
      assert.strictEqual(meta.app, 'leetcode')
      assert.strictEqual(meta.id, '123');
      assert.strictEqual(meta.lang, 'javascript');
    });

    it('should meta ok within file name', function() {
      file.data = x => [
        '/ *',
        '  * no meta app=leetcode id=123 lang=javascript',
        '  * /'
      ].join('\n');
      const meta = file.meta('321.dummy.py');
      assert(!meta.app)
      assert.strictEqual(meta.id, '321');
      assert.strictEqual(meta.lang, 'python');
    });

    it('should meta ok within deprecated file name', function() {
      file.data = x => [
        '/ *',
        '  * no meta app=leetcode id=123 lang=javascript',
        '  * /'
      ].join('\n');

      var meta = file.meta('111.dummy.py3');
      assert(!meta.app)
      assert.strictEqual(meta.id, '111');
      assert.strictEqual(meta.lang, 'python3');

      meta = file.meta('222.dummy.python3.py');
      assert(!meta.app)
      assert.strictEqual(meta.id, '222');
      assert.strictEqual(meta.lang, 'python3');
    });

    it('should fmt ok', function() {
      file.init();
      const data = file.fmt('${id}', {id: 123});
      assert.strictEqual(data, '123');
    });
  }); // #meta

  describe('#genneral', function() {
    beforeEach(function() {
      th.clean();
    });
    afterEach(function() {
      th.clean();
    });

    it('should mkdir ok', function() {
      const dir = th.DIR + 'dir';
      assert.strictEqual(fs.existsSync(dir), false);
      file.mkdir(dir);
      assert.strictEqual(fs.existsSync(dir), true);
      file.mkdir(dir);
      assert.strictEqual(fs.existsSync(dir), true);
    });

    it('should mv ok', function() {
      const SRC = th.Dir + 'src';
      const DST = th.DIR + 'dst';
      assert.strictEqual(fs.existsSync(SRC), false);
      assert.strictEqual(fs.existsSync(DST), false);
      file.mkdir(SRC);
      assert.strictEqual(fs.existsSync(SRC), true);
      assert.strictEqual(fs.existsSync(DST), false);
      file.mv(SRC, DST);
      assert.strictEqual(fs.existsSync(SRC), false);
      assert.strictEqual(fs.existsSync(DST), true);
    });
  }); // #general
});
