'use strict';
var fs = require('fs');
var path = require('path');

var h = require('./helper');

const cache = {};

cache.init = function() {
  h.mkdir(h.getCacheDir());
};

cache.get = function(k) {
  const fullpath = h.getCacheFile(k);
  if (!fs.existsSync(fullpath)) return null;

  return JSON.parse(fs.readFileSync(fullpath));
};

cache.set = function(k, v) {
  const fullpath = h.getCacheFile(k);
  fs.writeFileSync(fullpath, JSON.stringify(v));
  return true;
};

cache.del = function(k) {
  const fullpath = h.getCacheFile(k);
  if (!fs.existsSync(fullpath)) return false;

  fs.unlinkSync(fullpath);
  return true;
};

cache.list = function() {
  return fs.readdirSync(h.getCacheDir())
    .filter(x => path.extname(x) === '.json')
    .map(function(filename) {
      const k = path.basename(filename, '.json');
      const stat = fs.statSync(h.getCacheFile(k));
      return {
        name:  k,
        size:  stat.size,
        mtime: stat.mtime
      };
    });
};

module.exports = cache;
