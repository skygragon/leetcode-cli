var assert = require('chai').assert;
var rewire = require('rewire');

var log = require('../lib/log');
var Plugin = rewire('../lib/plugin');
var h = rewire('../lib/helper');

describe('plugin', function() {
  var leetcode = new Plugin(0, 'Leetcode', '2.0', '');
  var cache = new Plugin(1, 'Cache', '1.0', '');
  var retry = new Plugin(2, 'Retry', '3.0', '');
  var core = new Plugin(3, 'Core', '4.0', '');

  before(function() {
    log.init();

    var noop = function() {};
    cache.init = noop;
    leetcode.init = noop;
    retry.init = noop;
    core.init = noop;

    h.getCodeDirData = function() {
      return [
        {name: 'cache', data: cache},
        {name: 'leetcode', data: leetcode},
        {name: 'retry', data: retry},
        {name: 'bad', data: null}
      ];
    };
    Plugin.__set__('h', h);
  });

  it('should init ok', function() {
    assert.deepEqual(Plugin.plugins, []);
    Plugin.init(core);
    assert.deepEqual(Plugin.plugins.length, 3);

    var names = Plugin.plugins.map(function(p) {
      return p.name;
    });
    assert.deepEqual(names, ['Retry', 'Cache', 'Leetcode']);

    assert.equal(core.next, retry);
    assert.equal(retry.next, cache);
    assert.equal(cache.next, leetcode);
    assert.equal(leetcode.next, null);
  });
});
