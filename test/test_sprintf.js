'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');

const sprintf = require('../lib/sprintf');

describe('sprintf', function() {
  it('should ok', function() {
    assert.equal(sprintf('%%'), '%');
    assert.equal(sprintf('%s', 123), '123');
    assert.equal(sprintf('%6s', 123), '   123');
    assert.equal(sprintf('%06s', 123), '000123');
    assert.equal(sprintf('%-6s', 123), '123   ');
    assert.equal(sprintf('%=6s', 123), '  123 ');

    assert.equal(sprintf('%4s,%=4s,%-4s', 123, 'xy', 3.1), ' 123, xy ,3.1 ');
  });

  it('should non-ascii ok', function() {
    assert.equal(sprintf('%4s', '中'), '  中');
    assert.equal(sprintf('%-4s', '中'), '中  ');
    assert.equal(sprintf('%=4s', '中'), ' 中 ');

    assert.equal(sprintf('%=14s', '12你好34世界'), ' 12你好34世界 ');
  });

  it('should color ok', function() {
    const chalk = rewire('../lib/chalk');
    chalk.init();

    assert.equal(sprintf('%=3s', chalk.red('X')), ' ' + chalk.red('X') + ' ');
  });
});
