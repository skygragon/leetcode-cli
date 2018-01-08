'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');

describe('session', function() {
  let session;
  let stats;
  let now;

  beforeEach(function() {
    stats = null;
    const cache = {
      get: (k) => stats,
      set: (k, v) => stats = v
    };
    const moment = () => {
      return {format: () => now}
    };

    session = rewire('../lib/session');
    session.__set__('cache', cache);
    session.__set__('moment', moment);
  });

  describe('#updateStat', function() {
    it('should update number ok', function() {
      now = '2017.12.13';
      session.updateStat('ac', 10);
      assert.deepEqual(stats, {'2017.12.13': {ac: 10}});

      session.updateStat('ac', 20);
      assert.deepEqual(stats, {'2017.12.13': {ac: 30}});

      now = '2017.12.14';
      session.updateStat('ac', 40);
      assert.deepEqual(stats, {
        '2017.12.13': {ac: 30},
        '2017.12.14': {ac: 40}
      });
    });

    it('should update set ok', function() {
      now = '2017.12.13';
      session.updateStat('ac.set', 101);
      assert.deepEqual(stats, {'2017.12.13': {'ac.set': [101]}});
      session.updateStat('ac.set', 100);
      assert.deepEqual(stats, {'2017.12.13': {'ac.set': [101, 100]}});
      session.updateStat('ac.set', 101);
      assert.deepEqual(stats, {'2017.12.13': {'ac.set': [101, 100]}});
    });
  }); // #updateStat
});
