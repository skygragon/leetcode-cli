'use strict';
var assert = require('chai').assert;
var rewire = require('rewire');

var h = rewire('../lib/helper');

describe('icon', function() {
  var icon = null;

  before(function() {
    h.getCodeDirData = function() {
      return [
        {
          name: 'word',
          data: {
            yes:    'yes',
            no:     'no',
            lock:   'lock',
            like:   'like',
            unlike: 'unlike'
          }
        }
      ];
    };
  });

  beforeEach(function() {
    icon = rewire('../lib/icon');
    icon.__set__('h', h);
    icon.init();
  });

  describe('#setTheme', function() {
    it('should ok with known theme', function() {
      icon.setTheme('word');
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
  });
});
