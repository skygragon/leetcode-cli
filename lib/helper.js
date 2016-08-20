var fs = require('fs'),
    path = require('path');

var h = {};

h.prettyState = function(state) {
  switch(state) {
    case 'ac':    return '✔'; break;
    case 'notac': return '✘'; break;
    default:      return ' '; break;
  };
};

h.prettyYesNo = function(x) {
  return x ? '✔' : '✘';
};

h.statusToName = function(sc) {
  switch(sc) {
    case 10: return 'Accepted';              break;
    case 11: return 'Wrong Answer';          break;
    case 12: return 'Memory Limit Exceeded'; break;
    case 13: return 'Output Limit Exceeded'; break;
    case 14: return 'Time Limit Exceeded';   break;
    case 15: return 'Runtime Error';         break;
    case 16: return 'Internal Error';        break;
    case 20: return 'Compile Error';         break;
    case 21: return 'Unknown Error';         break;
    default: return 'Unknown';               break;
  }
};

h.langToExt = function(lang) {
  switch(lang) {
    case 'c':          return '.c';     break;
    case 'cpp':        return '.cpp';   break;
    case 'csharp':     return '.cs';    break;
    case 'golang':     return '.go';    break;
    case 'java':       return '.java';  break;
    case 'javascript': return '.js';    break;
    case 'python':     return '.py';    break;
    case 'ruby':       return '.rb';    break;
    case 'swift':      return '.swift'; break;
    default:           return '.raw';   break;
  }
};

h.extToLang = function(fullpath) {
  var ext = path.extname(fullpath);
  switch(ext) {
    case '.c':     return 'c';          break;
    case '.cpp':   return 'cpp';        break;
    case '.cs':    return 'csharp';     break;
    case '.go':    return 'golang';     break;
    case '.java':  return 'java';       break;
    case '.js':    return 'javascript'; break;
    case '.py':    return 'python';     break;
    case '.rb':    return 'ruby';       break;
    case '.swift': return 'swift';      break;
    default:       return 'unknown';    break;
  }
};

h.fileData = function(fullpath) {
  return fs.readFileSync(fullpath).toString();
};

h.getFilename = function(fullpath) {
  return path.basename(fullpath, path.extname(fullpath));
};

h.readStdin = function() {
  // FIXME: not work for win32
  return fs.readFileSync('/dev/stdin').toString();
};

h.getSetCookieValue = function(resp, key) {
  var cookies = resp.headers['set-cookie'];
  if (!cookies) return null;
  for (var i=0; i<cookies.length; ++i) {
    var sections = cookies[i].split(';');
    for (var j=0; j<sections.length; ++j) {
      var kv = sections[j].trim().split('=');
      if (kv[0] == key) return kv[1];
    }
  }
};

module.exports = h;
