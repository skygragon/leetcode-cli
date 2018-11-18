'use strict';
var fs = require('fs');
var path = require('path');

var _ = require('underscore');
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

/// general dirs & files ///
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

/// templates & metadata ///
file.render = function(tpl, data) {
  const tplfile = path.join(this.codeDir('templates'), tpl + '.tpl');
  let result = _.template(this.data(tplfile))(data);

  if (this.isWindows()) {
    result = result.replace(/\n/g, '\r\n');
  } else {
    result = result.replace(/\r\n/g, '\n');
  }
  return result;
};

file.metaByName = function(filename) {
  const m = {};

  // expect the 1st section in filename as id
  // e.g. 1.two-sum.cpp
  m.id = file.name(filename).split('.')[0];

  // HACK: compatible with old ext
  if (filename.endsWith('.py3') || filename.endsWith('.python3.py'))
    m.lang = 'python3';
  else
    m.lang = require('./helper').extToLang(filename);

  return m;
};

file.meta = function(filename) {
  const m = {};

  // first look into the file data
  const line = this.data(filename).split('\n')
    .find(x => x.indexOf(' @lc ') >= 0) || '';
  line.split(' ').forEach(function(x) {
    const v = x.split('=');
    if (v.length == 2) {
      m[v[0]] = v[1];
    }
  });

  // otherwise, look into file name
  if (!m.id || !m.lang) {
    const olddata = this.metaByName(filename);
    m.id = m.id || olddata.id;
    m.lang = m.lang || olddata.lang;
  }

  return m;
};

module.exports = file;
