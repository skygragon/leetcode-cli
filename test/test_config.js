var fs = require('fs');

var assert = require('chai').assert;
var rewire = require('rewire');
var _ = require('underscore');

describe('config', function() {
  var config;
  var f = './tmp/config.json';

  beforeEach(function() {
    config = rewire('../lib/config');
    var h = rewire('../lib/helper');
    h.getConfigFile = function() {
      return f;
    };
    config.__set__('h', h);
  });

  afterEach(function() {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  it('should ok w/o local config', function() {
    if (fs.existsSync(f)) fs.unlinkSync(f);

    var DEFAULT_CONFIG = config.__get__('DEFAULT_CONFIG');
    config.init();

    var actual = config.getAll();
    var expect = DEFAULT_CONFIG;
    assert.deepEqual(actual, expect);

    actual = config.getAll(true);
    expect = _.omit(expect, 'sys');
    assert.deepEqual(actual, expect);
  });

  it('should ok w/ local config', function() {
    var data = {
      autologin: {enable: false},
      code:      {lang: 'ruby'},
      color:     {enable: false}
    };
    fs.writeFileSync(f, JSON.stringify(data));

    config.init();

    assert.equal(config.autologin.enable, false);
    assert.equal(config.code.lang, 'ruby');
    assert.equal(config.color.enable, false);

    assert.equal(config.code.editor, 'vim');
  });
});
