'use strict';
const execSync = require('child_process').execSync;

const assert = require('chai').assert;
const rewire = require('rewire');

const cache = rewire('../lib/cache');
const h = rewire('../lib/helper');

describe('cache', function() {
  const k = '.test';
  const v = {test: 'data'};

  before(function() {
    const cachedir = './tmp';
    execSync('rm -rf ' + cachedir);

    h.getCacheDir = () => cachedir;
    cache.__set__('h', h);
    cache.init();
  });

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

  it('should list ok when no cached', function() {
    const items = cache.list();
    assert.equal(items.length, 0);
  });

  it('should list ok when cached', function() {
    assert.equal(cache.set(k, v), true);

    const items = cache.list();
    assert.equal(items.length, 1);

    assert.equal(items[0].name, k);
    assert.equal(items[0].size, JSON.stringify(v).length);
  });
});
