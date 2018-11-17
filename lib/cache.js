'use strict';
var fs = require('fs');
var path = require('path');

var file = require('./file');

const cache = {};

cache.init = function() {
  file.mkdir(file.cacheDir());
};

cache.get = function(k) {
  const fullpath = file.cacheFile(k);
  if (!fs.existsSync(fullpath)) return null;

  return JSON.parse(fs.readFileSync(fullpath));
};

cache.set = function(k, v) {
  const fullpath = file.cacheFile(k);
  fs.writeFileSync(fullpath, JSON.stringify(v));
  return true;
};

cache.del = function(k) {
  const fullpath = file.cacheFile(k);
  if (!fs.existsSync(fullpath)) return false;

  fs.unlinkSync(fullpath);
  return true;
};

cache.list = function() {
  return file.list(file.cacheDir())
    .filter(x => path.extname(x) === '.json')
    .map(function(filename) {
      const k = path.basename(filename, '.json');
      const stat = fs.statSync(file.cacheFile(k));
      return {
        name:  k,
        size:  stat.size,
        mtime: stat.mtime
      };
    });
};

module.exports = cache;
