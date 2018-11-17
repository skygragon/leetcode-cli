'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');
const _ = require('underscore');

const th = require('./helper');

describe('config', function() {
  let config;
  const FILE = './tmp/config.json';

  beforeEach(function() {
    th.clean();

    const file = rewire('../lib/file');
    file.configFile = () => FILE;

    config = rewire('../lib/config');
    config.__set__('file', file);
  });

  function createConfigFile(data) {
    const fs = require('fs');
    fs.writeFileSync(FILE, JSON.stringify(data));
  }

  it('should ok w/o local config', function() {
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
    createConfigFile({
      autologin: {enable: false},
      code:      {lang: 'ruby'},
      color:     {enable: false}
    });
    config.init();

    assert.equal(config.autologin.enable, false);
    assert.equal(config.code.lang, 'ruby');
    assert.equal(config.color.enable, false);
    assert.equal(config.code.editor, 'vim');
  });

  it('should remove legacy keys', function() {
    createConfigFile({
      USE_COLOR: true,
      code:      {lang: 'ruby'}
    });
    config.init();

    assert.equal(config.USE_COLOR, undefined);
    assert.equal(config.code.lang, 'ruby');
  });
});
