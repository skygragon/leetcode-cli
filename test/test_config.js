'use strict';
const fs = require('fs');

const assert = require('chai').assert;
const rewire = require('rewire');
const _ = require('underscore');

describe('config', function() {
  let config;
  const f = './tmp/config.json';

  beforeEach(function() {
    config = rewire('../lib/config');
    const h = rewire('../lib/helper');
    h.getConfigFile = () => f;
    config.__set__('h', h);
  });

  afterEach(function() {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  it('should ok w/o local config', function() {
    if (fs.existsSync(f)) fs.unlinkSync(f);

    const DEFAULT_CONFIG = config.__get__('DEFAULT_CONFIG');
    config.init();

    let actual = config.getAll();
    let expect = DEFAULT_CONFIG;
    assert.deepEqual(actual, expect);

    actual = config.getAll(true);
    expect = _.omit(expect, 'sys');
    assert.deepEqual(actual, expect);
  });

  it('should ok w/ local config', function() {
    const data = {
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

  it('should remove legacy keys', function() {
    const data = {
      USE_COLOR: true,
      code:      {lang: 'ruby'}
    };
    fs.writeFileSync(f, JSON.stringify(data));

    config.init();

    assert.equal(config.USE_COLOR, undefined);
    assert.equal(config.code.lang, 'ruby');
  });
});
