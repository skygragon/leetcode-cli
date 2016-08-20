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

h.fileExt = function(lang) {
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

h.fileLang = function(fullpath) {
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
