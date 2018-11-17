'use strict';
var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

const file = {}

file.isWindows = function() {
  return process.platform === 'win32';
};

/// app dirs ///
file.userHomeDir = function() {
  return process.env.HOME || process.env.USERPROFILE;
};

file.homeDir = function() {
  return path.join(this.userHomeDir(), '.lc');
};

file.appDir = function() {
  const config = require('./config');
  return path.join(this.homeDir(), config.app || 'leetcode');
};

file.cacheDir = function() {
  return path.join(this.appDir(), 'cache');
};

file.codeDir = function(dir) {
  return path.join(__dirname, '..', dir || '');
};

/// app files ///
file.cacheFile = function(k) {
  return path.join(this.cacheDir(), k + '.json');
};

file.configFile = function() {
  return path.join(this.homeDir(), 'config.json');
};

file.pluginFile = function(name) {
  return path.join(this.codeDir('lib/plugins'), path.basename(name));
};

file.listCodeDir = function(dir) {
  dir = this.codeDir(dir);
  return this.list(dir).map(function(f) {
    const fullpath = path.join(dir, f);
    const ext = path.extname(f);
    const name = path.basename(f, ext);

    let data = null;
    switch (ext) {
      case '.js':   data = require(fullpath); break;
      case '.json': data = JSON.parse(file.data(fullpath)); break;
    }
    return {name: name, data: data, file: f};
  });
};

/// general dirs & files
file.mkdir = function(fullpath) {
  if (fs.existsSync(fullpath)) return;
  mkdirp.sync(fullpath);
};

file.list = function(dir) {
  return fs.readdirSync(dir);
}

file.name = function(fullpath) {
  return path.basename(fullpath, path.extname(fullpath));
};

file.data = function(fullpath) {
  return fs.existsSync(fullpath) ? fs.readFileSync(fullpath).toString() : null;
};

module.exports = file;
