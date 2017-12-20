var _ = require('underscore');

var config = require('./config');

var queue = {};

function workerRun(ctx) {
  // no more tasks, quit now
  if (ctx.tasks.length === 0) {
    if (--ctx.workers === 0 && ctx.cb)
      ctx.cb(ctx.error);
    return;
  }

  var task = ctx.tasks.shift();
  ctx.doTask(task, function(e) {
    if (e) ctx.error = e;

    // TODO: could retry failed task here.
    setImmediate(workerRun, ctx);
  });
}

queue.run = function(tasks, doTask, cb) {
  var ctx = {
    tasks:   _.clone(tasks),
    doTask:  doTask,
    cb:      cb,
    workers: config.network.concurrency || 1,
    error:   null
  };

  for (var i = 0; i < ctx.workers; ++i) {
    setImmediate(workerRun, ctx);
  }
};

module.exports = queue;
