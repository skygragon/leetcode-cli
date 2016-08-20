var assert = require('chai').assert;

var h = require('../lib/helper');

describe('helper', function() {
  describe('#getSetCookieValue', function() {
    it('should ok', function() {
      var resp = {
        headers: {'set-cookie': [
          'key1=value1; path=/; Httponly',
          'key2=value2; path=/; Httponly']
        }
      };

      assert.equal(h.getSetCookieValue(resp, 'key1'), 'value1');
      assert.equal(h.getSetCookieValue(resp, 'key2'), 'value2');
      assert.equal(h.getSetCookieValue(resp, 'key3'), null);
    });
  });
});
