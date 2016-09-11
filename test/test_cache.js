var assert = require('chai').assert;

var cache = require('../lib/cache');

describe('cache', function() {
  var k = '.test';
  var v = {test: 'data'};

  it('should ok when not cached', function() {
    cache.del(k);

    assert.equal(cache.get(k), null);
    assert.equal(cache.del(k), false);
  });

  it('should ok when cached', function() {
    assert.equal(cache.set(k, v), true);

    assert.deepEqual(cache.get(k), v);
    assert.equal(cache.del(k), true);
  });
});
