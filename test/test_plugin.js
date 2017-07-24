var _ = require('underscore');
var assert = require('chai').assert;
var rewire = require('rewire');

var log = require('../lib/log');
var Plugin = rewire('../lib/plugin');
var h = rewire('../lib/helper');

describe('plugin', function() {
  var cache = new Plugin('cache', 'Cache', '1.0', '');
  var leetcode = new Plugin('leetcode', 'Leetcode', '2.0', '');
  var retry = new Plugin('retry', 'Retry', '3.0', '');
  var core = new Plugin('core', 'Core', '4.0', '');

  before(function() {
    log.init();

    var noop = function() {};
    cache.init = noop;
    leetcode.init = noop;
    retry.init = noop;
    core.init = noop;

    h.getDirData = function() {
      return [
        {name: 'cache', data: cache},
        {name: 'leetcode', data: leetcode},
        {name: 'retry', data: retry},
        {name: 'core', data: core},
        {name: 'bad', data: null}
      ];
    };
    Plugin.__set__('h', h);
  });

  it('should init ok', function() {
    assert.deepEqual(_.keys(Plugin.plugins), []);
    Plugin.init(core);
    assert.deepEqual(_.keys(Plugin.plugins), ['cache', 'leetcode', 'retry', 'core']);

    assert.equal(core.next, retry);
    assert.equal(retry.next, cache);
    assert.equal(cache.next, leetcode);
    assert.equal(leetcode.next, null);
  });
});
