'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');

const session = rewire('../lib/session');

describe('session', function() {
  let stats = null;
  let now = '';

  before(function() {
    const cache = {
      get: (k) => stats,
      set: (k, v) => stats = v
    };
    session.__set__('cache', cache);

    const moment = () => {
      return {
        format: () => now
      }
    };
    session.__set__('moment', moment);
  });

  describe('#updateStat', function() {
    it('should ok', function() {
      now = '2017.12.13';
      session.updateStat('ac', 10);
      assert.deepEqual(stats, {
        '2017.12.13': {ac: 10}
      });

      session.updateStat('ac', 20);
      assert.deepEqual(stats, {
        '2017.12.13': {ac: 30}
      });

      now = '2017.12.14';
      session.updateStat('ac', 40);
      assert.deepEqual(stats, {
        '2017.12.13': {ac: 30},
        '2017.12.14': {ac: 40}
      });
    });
  });
});
