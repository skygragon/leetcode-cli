var fs = require('fs');
var path = require('path');

var h = require('./helper');

var cache = {};

cache.init = function() {
  h.mkdir(h.getCacheDir());
};

cache.get = function(k) {
  var fullpath = h.getCacheFile(k);
  if (!fs.existsSync(fullpath)) return null;

  var v = JSON.parse(fs.readFileSync(fullpath));
  return v;
};

cache.set = function(k, v) {
  var fullpath = h.getCacheFile(k);
  fs.writeFileSync(fullpath, JSON.stringify(v));
  return true;
};

cache.del = function(k) {
  var fullpath = h.getCacheFile(k);
  if (!fs.existsSync(fullpath)) return false;

  fs.unlinkSync(fullpath);
  return true;
};

cache.list = function() {
  return fs.readdirSync(h.getCacheDir())
    .filter(function(filename) {
      return path.extname(filename) === '.json';
    })
    .map(function(filename) {
      var k = path.basename(filename, '.json');
      var stat = fs.statSync(h.getCacheFile(k));
      return {
        name:  k,
        size:  stat.size,
        mtime: stat.mtime
      };
    });
};

module.exports = cache;
