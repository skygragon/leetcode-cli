var assert = require('chai').assert;
var rewire = require('rewire');
var _ = require('underscore');

describe('config', function() {
  it('should ok w/o local config', function() {
    var h = rewire('../lib/helper');
    h.getConfigFile = function() {
      return 'local-config-not-exist-at-all';
    };

    var config = rewire('../lib/config');
    config.__set__('h', h);
    config.init();

    var expect = config.__get__('DEFAULT_CONFIG');
    var actual = _.extendOwn({}, config); // remove 'init' function
    assert.equal(_.isEqual(actual, expect), true);
  });

  it('should ok w/ local config', function() {
    var localConfig = {LANG: 'ruby', USE_COLOR: false, AUTO_LOGIN: false};

    var h = rewire('../lib/helper');
    h.getFileData = function() {
      return JSON.stringify(localConfig);
    };

    var config = rewire('../lib/config');
    config.__set__('h', h);
    config.init();

    var expect = _.extendOwn(config.__get__('DEFAULT_CONFIG'), localConfig);
    var actual = _.extendOwn({}, config); // remove 'init' function
    assert.equal(_.isEqual(actual, expect), true);
  });
});
