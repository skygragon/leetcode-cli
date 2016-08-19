var fs = require('fs');

// try to save cache in user home.
var BASE_DIR = (process.env.HOME || process.env.USERPROFILE) + '/.lc/';

function getFullPath(k) {
  if (!fs.existsSync(BASE_DIR))
    fs.mkdirSync(BASE_DIR);

  return BASE_DIR + k + '.json';
}

var cache = {};

cache.get = function(k) {
  var fullpath = getFullPath(k);
  if (!fs.existsSync(fullpath)) return null;

  var v = JSON.parse(fs.readFileSync(fullpath));
  return v;
};

cache.set = function(k, v) {
  var fullpath = getFullPath(k);
  fs.writeFileSync(fullpath, JSON.stringify(v));
  return true;
};

cache.del = function(k) {
  var fullpath = getFullPath(k);
  if (!fs.existsSync(fullpath)) return false;

  fs.unlinkSync(fullpath);
  return true;
};

module.exports = cache;
