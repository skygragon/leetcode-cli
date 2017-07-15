var fs = require('fs');
var path = require('path');

var h = require('./helper');

var cache = {};

cache.get = function(k) {
  var fullpath = h.getCacheFile(k);
  if (!fs.existsSync(fullpath)) return null;

  var v = JSON.parse(fs.readFileSync(fullpath));
  return v;
};

cache.set = function(k, v) {
  var dir = h.getCacheDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

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
  var dir = h.getCacheDir();
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir).map(function(filename) {
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
