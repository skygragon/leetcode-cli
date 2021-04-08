'use strict';
var path = require('path');

var file = require('./file');

const cache = {};

cache.init = function() {
  file.mkdir(file.cacheDir());
};

cache.deleteAll = function () {
  cache.list().forEach(value => {
    cache.del(value.name);
  })
};

cache.get = function(k) {
  const fullpath = file.cacheFile(k);
  if (!file.exist(fullpath)) return null;

  return JSON.parse(file.data(fullpath));
};

cache.set = function(k, v) {
  const fullpath = file.cacheFile(k);
  file.write(fullpath, JSON.stringify(v));
  return true;
};

cache.del = function(k) {
  const fullpath = file.cacheFile(k);
  if (!file.exist(fullpath)) return false;

  file.rm(fullpath);
  return true;
};

cache.list = function() {
  return file.list(file.cacheDir())
    .filter(x => path.extname(x) === '.json')
    .map(function(filename) {
      const k = path.basename(filename, '.json');
      const stat = file.stat(file.cacheFile(k));
      return {
        name:  k,
        size:  stat.size,
        mtime: stat.mtime
      };
    });
};

module.exports = cache;
