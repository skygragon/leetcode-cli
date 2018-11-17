'use strict';
const path = require('path');

const assert = require('chai').assert;
const rewire = require('rewire');

describe('file', function() {
  let file;

  beforeEach(function() {
    file = rewire('../lib/file');
  });

  describe('#dirAndFiles', function() {
    const HOME = path.join(__dirname, '..');

    it('should ok', function() {
      process.env.HOME = '/home/skygragon';

      assert.equal(file.userHomeDir(), '/home/skygragon');
      assert.equal(file.homeDir(), '/home/skygragon/.lc');
      assert.equal(file.cacheDir(), '/home/skygragon/.lc/leetcode/cache');
      assert.equal(file.cacheFile('xxx'), '/home/skygragon/.lc/leetcode/cache/xxx.json');
      assert.equal(file.configFile(), '/home/skygragon/.lc/config.json');
      assert.equal(file.name('/home/skygragon/.lc/leetcode/cache/xxx.json'), 'xxx');

      process.env.HOME = '';
      process.env.USERPROFILE = 'C:\\Users\\skygragon';
      assert.equal(file.userHomeDir(), 'C:\\Users\\skygragon');
    });

    it('should codeDir ok', function() {
      assert.equal(file.codeDir(), HOME);
      assert.equal(file.codeDir('.'), HOME);
      assert.equal(file.codeDir('icons'), path.join(HOME, 'icons'));
      assert.equal(file.codeDir('lib/plugins'), path.join(HOME, 'lib', 'plugins'));
    });

    it('should listCodeDir ok', function() {
      const files = file.listCodeDir('lib/plugins');
      assert.equal(files.length, 3);
      assert.equal(files[0].name, 'cache');
      assert.equal(files[1].name, 'leetcode');
      assert.equal(files[2].name, 'retry');
    });

    it('should pluginFile ok', function() {
      const expect = path.join(HOME, 'lib/plugins/cache.js');
      assert.equal(file.pluginFile('cache.js'), expect);
      assert.equal(file.pluginFile('./cache.js'), expect);
      assert.equal(file.pluginFile('https://github.com/skygragon/cache.js'), expect);
    });

    it('should data ok with missing file', function() {
      assert.equal(file.data('non-exist'), null);
    });
  }); // #dirAndFiles
});
