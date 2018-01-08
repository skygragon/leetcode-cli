'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');

const chalk = require('../lib/chalk');

describe('log', function() {
  let log;
  let savedOutput;
  let expected;

  before(function() {
    chalk.init();
  });

  beforeEach(function() {
    log = rewire('../lib/log');
    savedOutput = log.output;
    log.output = x => expected = x;

    log.init();
    expected = '';
  });

  afterEach(function() {
    log.output = savedOutput;
  });

  describe('#setLevel', function() {
    it('should ok with known level', function() {
      log.setLevel('TRACE');
      assert.deepEqual(log.level, log.levels.get('TRACE'));
      log.setLevel('DEBUG');
      assert.deepEqual(log.level, log.levels.get('DEBUG'));
      log.setLevel('INFO');
      assert.deepEqual(log.level, log.levels.get('INFO'));
      log.setLevel('WARN');
      assert.deepEqual(log.level, log.levels.get('WARN'));
      log.setLevel('ERROR');
      assert.deepEqual(log.level, log.levels.get('ERROR'));
    });

    it('should ok with unknown level', function() {
      log.setLevel('');
      assert.deepEqual(log.level, log.levels.get('INFO'));
    });
  }); // #setLevel

  describe('#isEnabled', function() {
    it('should ok', function() {
      log.setLevel('DEBUG');
      assert.equal(log.isEnabled('TRACE'), false);
      assert.equal(log.isEnabled('DEBUG'), true);
      assert.equal(log.isEnabled('INFO'), true);
      assert.equal(log.isEnabled('WARN'), true);
      assert.equal(log.isEnabled('ERROR'), true);
    });
  }); // #isEnabled

  describe('#levels', function() {
    it('should ok with log.trace', function() {
      log.trace('some error');
      assert.equal(expected, '');

      log.setLevel('TRACE');
      log.trace('some error');
      assert.equal(expected, chalk.gray('[TRACE] some error'));
    });

    it('should ok with log.debug', function() {
      log.debug('some error');
      assert.equal(expected, '');

      log.setLevel('DEBUG');
      log.debug('some error');
      assert.equal(expected, chalk.gray('[DEBUG] some error'));
    });

    it('should ok with log.info', function() {
      log.info('some error');
      assert.equal(expected, 'some error');
    });

    it('should ok with log.warn', function() {
      log.warn('some error');
      assert.equal(expected, chalk.yellow('[WARN] some error'));
    });

    it('should ok with log.error', function() {
      log.error('some error');
      assert.equal(expected, chalk.red('[ERROR] some error'));
    });

    it('should ok with log.fail', function() {
      log.fail({msg: 'some error', statusCode: 500});
      assert.equal(expected, chalk.red('[ERROR] some error [500]'));

      log.fail('some error');
      assert.equal(expected, chalk.red('[ERROR] some error [0]'));
    });
  }); // #levels

  describe('#printf', function() {
    it('should ok', function() {
      log.printf('%s and %d and %%', 'string', 100);
      assert.equal(expected, 'string and 100 and %');
    });
  }); // #printf
});
