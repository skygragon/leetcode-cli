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

    var expect = config.getDefaultConfig();
    var actual = _.extendOwn({}, config); // remove 'init' function
    assert.equal(_.isEqual(actual, expect), true);
  });

  it('should ok w/ local config', function() {
    var localConfig = {
      AUTO_LOGIN: false,
      LANG:       'ruby',
      USE_COLOR:  false
    };

    var h = rewire('../lib/helper');
    h.getFileData = function() {
      return JSON.stringify(localConfig);
    };

    var config = rewire('../lib/config');
    config.__set__('h', h);
    config.init();

    var expect = config.getDefaultConfig();
    var actual = _.extendOwn({}, config); // remove 'init' function
    _.extendOwn(expect, localConfig);
    assert.equal(_.isEqual(actual, expect), true);
  });
});
