'use strict';
var assert = require('chai').assert;

var chalk = require('../lib/chalk');
var log = require('../lib/log');

describe('log', function() {
  var _output = null;
  var result = '';

  before(function() {
    chalk.init();
    _output = log.output;
    log.output = function(s) {
      result = s;
    };
  });

  after(function() {
    log.output = _output;
  });

  beforeEach(function() {
    log.init();
    result = '';
  });

  describe('#setLevel', function() {
    it('should ok with known level', function() {
      log.setLevel('TRACE');
      assert.deepEqual(log.level, log.levels.TRACE);
      log.setLevel('DEBUG');
      assert.deepEqual(log.level, log.levels.DEBUG);
      log.setLevel('INFO');
      assert.deepEqual(log.level, log.levels.INFO);
      log.setLevel('WARN');
      assert.deepEqual(log.level, log.levels.WARN);
      log.setLevel('ERROR');
      assert.deepEqual(log.level, log.levels.ERROR);
    });

    it('should ok with unknown level', function() {
      log.setLevel('');
      assert.deepEqual(log.level, log.levels.INFO);
    });
  });

  describe('#isEnabled', function() {
    it('should ok', function() {
      log.setLevel('DEBUG');
      assert.equal(log.isEnabled('TRACE'), false);
      assert.equal(log.isEnabled('DEBUG'), true);
      assert.equal(log.isEnabled('INFO'), true);
      assert.equal(log.isEnabled('WARN'), true);
      assert.equal(log.isEnabled('ERROR'), true);
    });
  });

  describe('#levels', function() {
    it('should ok with log.trace', function() {
      log.trace('some error');
      assert.equal(result, '');

      log.setLevel('TRACE');
      log.trace('some error');
      assert.equal(result, chalk.gray('[TRACE] some error'));
    });

    it('should ok with log.debug', function() {
      log.debug('some error');
      assert.equal(result, '');

      log.setLevel('DEBUG');
      log.debug('some error');
      assert.equal(result, chalk.gray('[DEBUG] some error'));
    });

    it('should ok with log.info', function() {
      log.info('some error');
      assert.equal(result, 'some error');
    });

    it('should ok with log.warn', function() {
      log.warn('some error');
      assert.equal(result, chalk.yellow('[WARN] some error'));
    });

    it('should ok with log.error', function() {
      log.error('some error');
      assert.equal(result, chalk.red('[ERROR] some error'));
    });

    it('should ok with log.fail', function() {
      log.fail({msg: 'some error', statusCode: 500});
      assert.equal(result, chalk.red('[ERROR] some error [500]'));

      log.fail('some error');
      assert.equal(result, chalk.red('[ERROR] some error [0]'));
    });
  });

  describe('#printf', function() {
    it('should ok', function() {
      log.printf('%s and %d and %%', 'string', 100);
      assert.equal(result, 'string and 100 and %');
    });
  });
});
