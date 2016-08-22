var chalk = require('chalk');
var fs = require('fs');
var path = require('path');

var h = {};

h.prettyState = function(state) {
  switch (state) {
    case 'ac':    return chalk.green('✔');
    case 'notac': return chalk.red('✘');
    default:      return ' ';
  }
};

h.prettyYesNo = function(x) {
  return x ? '✔' : '✘';
};

h.statusToName = function(sc) {
  switch (sc) {
    case 10: return 'Accepted';
    case 11: return 'Wrong Answer';
    case 12: return 'Memory Limit Exceeded';
    case 13: return 'Output Limit Exceeded';
    case 14: return 'Time Limit Exceeded';
    case 15: return 'Runtime Error';
    case 16: return 'Internal Error';
    case 20: return 'Compile Error';
    case 21: return 'Unknown Error';
    default: return 'Unknown';
  }
};

h.langToExt = function(lang) {
  switch (lang) {
    case 'c':          return '.c';
    case 'cpp':        return '.cpp';
    case 'csharp':     return '.cs';
    case 'golang':     return '.go';
    case 'java':       return '.java';
    case 'javascript': return '.js';
    case 'python':     return '.py';
    case 'ruby':       return '.rb';
    case 'swift':      return '.swift';
    default:           return '.raw';
  }
};

h.extToLang = function(fullpath) {
  var ext = path.extname(fullpath);
  switch (ext) {
    case '.c':     return 'c';
    case '.cpp':   return 'cpp';
    case '.cs':    return 'csharp';
    case '.go':    return 'golang';
    case '.java':  return 'java';
    case '.js':    return 'javascript';
    case '.py':    return 'python';
    case '.rb'   : return 'ruby';
    case '.swift': return 'swift';
    default:       return 'unknown';
  }
};

h.fileData = function(fullpath) {
  return fs.readFileSync(fullpath).toString();
};

h.getFilename = function(fullpath) {
  return path.basename(fullpath, path.extname(fullpath));
};

h.getHomeDir = function() {
  return process.env.HOME || process.env.USERPROFILE;
};

h.readStdin = function() {
  // FIXME: not work for win32
  return fs.readFileSync('/dev/stdin').toString();
};

h.getSetCookieValue = function(resp, key) {
  var cookies = resp.headers['set-cookie'];
  if (!cookies) return null;

  for (var i = 0; i < cookies.length; ++i) {
    var sections = cookies[i].split(';');
    for (var j = 0; j < sections.length; ++j) {
      var kv = sections[j].trim().split('=');
      if (kv[0] === key) return kv[1];
    }
  }
  return null;
};

module.exports = h;
