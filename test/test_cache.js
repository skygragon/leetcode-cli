var execSync = require('child_process').execSync;

var assert = require('chai').assert;
var rewire = require('rewire');

var cache = rewire('../lib/cache');
var h = rewire('../lib/helper');

describe('cache', function() {
  var k = '.test';
  var v = {test: 'data'};

  before(function() {
    var cachedir = './tmp';
    execSync('rm -rf ' + cachedir);

    h.getCacheDir = function() {
      return cachedir;
    };
    cache.__set__('h', h);
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
});
