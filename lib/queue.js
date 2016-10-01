var config = require('./config');

var queue = {};

function startWorker(ctx) {
  // no more tasks, quit now
  if (ctx.tasks.length === 0) {
    if (--ctx.workers === 0 && ctx.cb)
      ctx.cb();
    return;
  }

  var task = ctx.tasks.shift();
  ctx.doTask(task, function(e) {
    // TODO: could retry failed task here.
    startWorker(ctx);
  });
}

queue.run = function(tasks, doTask, cb) {
  var ctx = {
    tasks:   tasks,
    doTask:  doTask,
    cb:      cb,
    workers: config.MAX_WORKERS
  };

  for (var i = 0; i < ctx.workers; ++i) {
    startWorker(ctx);
  }
};

module.exports = queue;
