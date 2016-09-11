var fs = require('fs');

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

module.exports = cache;
