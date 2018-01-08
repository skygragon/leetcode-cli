'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');



describe('queue', function() {
  let Queue;

  beforeEach(function() {
    Queue = rewire('../lib/queue');
  });

  it('should ok', function(done) {
    function doTask(x, q, cb) {
      ++q.ctx.n;
      q.ctx.sum += x;
      return cb();
    }

    const ctx = {n: 0, sum: 0};
    const q = new Queue([], ctx, doTask);

    q.addTask(1);
    q.addTask(2);
    q.addTasks([3, 4, 5]);

    q.run(5, function(e, ctx) {
      assert.notExists(e);
      assert.equal(ctx.n, 5);
      assert.equal(ctx.sum, 15);
      done();
    });
  });

  it('should ok in sequence', function(done) {
    const config = {network: {}};
    Queue.__set__('config', config);

    function doTask(x, q, cb) {
      if (!q.ctx.list) q.ctx.list = [];
      q.ctx.list.push(x);
      return cb();
    }

    const q = new Queue(null, null, doTask);
    q.addTask(1);
    q.addTasks([2, 3]);
    q.addTasks([4]);
    q.addTask(5);

    q.run(null, function(e, ctx) {
      assert.notExists(e);
      assert.deepEqual(ctx.list, [1, 2, 3, 4, 5]);
      done();
    });
  });
});
