'use strict';
var _ = require('underscore');

var config = require('./config');

function Queue(tasks, ctx, onTask) {
  this.tasks = _.clone(tasks) || [];
  this.ctx = ctx || {};
  this.onTask = onTask;
  this.error = null;
}

Queue.prototype.addTask = function(task) {
  this.tasks.push(task);
  return this;
};

Queue.prototype.addTasks = function(tasks) {
  this.tasks = this.tasks.concat(tasks);
  return this;
};

Queue.prototype.run = function(concurrency, onDone) {
  this.concurrency = concurrency || config.network.concurrency || 1;
  this.onDone = onDone;

  const self = this;
  for (let i = 0; i < this.concurrency; ++i) {
    setImmediate(function() { self.workerRun(); });
  }
};

Queue.prototype.workerRun = function() {
  // no more tasks, quit now
  if (this.tasks.length === 0) {
    if (--this.concurrency === 0 && this.onDone)
      this.onDone(this.error, this.ctx);
    return;
  }

  const task = this.tasks.shift();
  const self = this;
  this.onTask(task, self, function(e) {
    if (e) self.error = e;

    // TODO: could retry failed task here.
    setImmediate(function() { self.workerRun(); });
  });
};

module.exports = Queue;
