'use strict';
const assert = require('chai').assert;
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
      assert.equal(icon.yes, 'yes');
      assert.equal(icon.no, 'no');
      assert.equal(icon.lock, 'lock');
      assert.equal(icon.like, 'like');
      assert.equal(icon.unlike, 'unlike');
    });

    it('should ok with unknown theme', function() {
      icon.setTheme('non-exist');
      assert.equal(icon.yes, '✔');
      assert.equal(icon.no, '✘');
      assert.equal(icon.lock, '🔒');
      assert.equal(icon.like, '★');
      assert.equal(icon.unlike, '☆');
    });

    it('should ok with unknown theme on windows', function() {
      file.isWindows = () => true;

      icon.setTheme('non-exist');
      assert.equal(icon.yes, 'YES');
      assert.equal(icon.no, 'NO');
      assert.equal(icon.lock, 'LOCK');
      assert.equal(icon.like, 'LIKE');
      assert.equal(icon.unlike, 'UNLIKE');
    });
  }); // #setTheme
});
