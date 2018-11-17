'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');

const th = require('./helper');

describe('cache', function() {
  let cache;

  const K = '.test';
  const V = {test: 'data'};

  beforeEach(function() {
    th.clean();

    const file = rewire('../lib/file');
    file.cacheDir = () => th.DIR;

    cache = rewire('../lib/cache');
    cache.__set__('file', file);
    cache.init();
  });

  it('should get ok when not cached', function() {
    cache.del(K);
    assert.equal(cache.get(K), null);
    assert.equal(cache.del(K), false);
  });

  it('should get ok when cached', function() {
    assert.equal(cache.set(K, V), true);
    assert.deepEqual(cache.get(K), V);
    assert.equal(cache.del(K), true);
  });

  it('should list ok when no cached', function() {
    const items = cache.list();
    assert.equal(items.length, 0);
  });

  it('should list ok when cached', function() {
    assert.equal(cache.set(K, V), true);
    const items = cache.list();
    assert.equal(items.length, 1);
    assert.equal(items[0].name, K);
    assert.equal(items[0].size, JSON.stringify(V).length);
  });
});
