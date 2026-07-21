'use strict';
const assert = require('assert').strict;
const rewire = require('rewire');

describe('icon', function() {
  let icon;
  let file;

  beforeEach(function() {
    file = rewire('../lib/file');
    file.listCodeDir = function() {
      return [
        {name: 'mac', data: {yes: 'yes', no: 'no', lock: 'lock', like: 'like', unlike: 'unlike'}},
        {name: 'win7', data: {yes: 'YES', no: 'NO', lock: 'LOCK', like: 'LIKE', unlike: 'UNLIKE'}}
      ];
    };

    icon = rewire('../lib/icon');
    icon.__set__('file', file);
    icon.init();
  });

  describe('#setTheme', function() {
    it('should ok with known theme', function() {
      icon.setTheme('mac');
      assert.strictEqual(icon.yes, 'yes');
      assert.strictEqual(icon.no, 'no');
      assert.strictEqual(icon.lock, 'lock');
      assert.strictEqual(icon.like, 'like');
      assert.strictEqual(icon.unlike, 'unlike');
    });

    it('should ok with unknown theme on linux', function() {
      file.isWindows = () => false;

      icon.setTheme('non-exist');
      assert.strictEqual(icon.yes, '✔');
      assert.strictEqual(icon.no, '✘');
      assert.strictEqual(icon.lock, '🔒');
      assert.strictEqual(icon.like, '★');
      assert.strictEqual(icon.unlike, '☆');
    });

    it('should ok with unknown theme on windows', function() {
      file.isWindows = () => true;

      icon.setTheme('non-exist');
      assert.strictEqual(icon.yes, 'YES');
      assert.strictEqual(icon.no, 'NO');
      assert.strictEqual(icon.lock, 'LOCK');
      assert.strictEqual(icon.like, 'LIKE');
      assert.strictEqual(icon.unlike, 'UNLIKE');
    });
  }); // #setTheme
});
