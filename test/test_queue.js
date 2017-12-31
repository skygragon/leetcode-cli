var assert = require('chai').assert;

var Queue = require('../lib/queue');

describe('queue', function() {
  it('should ok', function(done) {
    function doTask(x, q, cb) {
      ++q.ctx.n;
      q.ctx.sum += x;
      return cb();
    }

    var ctx = {n: 0, sum: 0};
    var q = new Queue([], ctx, doTask);

    q.addTask(1);
    q.addTask(2);
    q.addTasks([3, 4, 5]);

    q.run(5, function(e, ctx) {
      assert.equal(e, null);
      assert.equal(ctx.n, 5);
      assert.equal(ctx.sum, 15);
      done();
    });
  });
});
