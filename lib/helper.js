var fs = require('fs');
var path = require('path');

var _ = require('underscore');

var h = {};

h.prettyState = function(state) {
  switch (state) {
    case 'ac':    return this.prettyText('', true);
    case 'notac': return this.prettyText('', false);
    default:      return ' ';
  }
};

h.prettyText = function(text, yesNo) {
  var chalk = require('./chalk');
  var icon = require('./icon');
  switch (yesNo) {
    case true:  return chalk.green(icon.yes + text);
    case false: return chalk.red(icon.no + text);
    default:    return text;
  }
};

h.levelToName = function(level) {
  switch (level) {
    case 1:  return 'Easy';
    case 2:  return 'Medium';
    case 3:  return 'Hard';
    default: return ' ';
  }
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

h.langToCommentStyle = function(lang) {
  switch (lang) {
    case 'c':
    case 'cpp':
    case 'csharp':
    case 'golang':
    case 'java':
    case 'javascript':
    case 'swift':
    default:
      return {
        commentHeader: '/*',
        commentLine:   ' *',
        commentFooter: ' */'
      };
    case 'python':
    case 'ruby':
      return {
        commentHeader: '#',
        commentLine:   '#',
        commentFooter: '#'
      };
  }
};

h.getFileData = function(p) {
  return fs.existsSync(p) ? fs.readFileSync(p).toString() : null;
};

h.getDirData = function(p) {
  var dir = path.join(__dirname, '..', p);
  return _.map(fs.readdirSync(dir), function(f) {
    return {
      name: path.basename(f, '.json'),
      data: JSON.parse(fs.readFileSync(path.join(dir, f)))
    };
  });
};

h.getFilename = function(fullpath) {
  return path.basename(fullpath, path.extname(fullpath));
};

h.getHomeDir = function() {
  return process.env.HOME || process.env.USERPROFILE;
};

h.getCacheDir = function() {
  return path.join(this.getHomeDir(), '.lc');
};

h.getCacheFile = function(k) {
  return path.join(this.getCacheDir(), k + '.json');
};

h.getConfigFile = function() {
  return path.join(this.getHomeDir(), '.lcconfig');
};

h.readStdin = function(cb) {
  var stdin = process.stdin;
  var bufs = [];

  stdin.on('readable', function() {
    var data = stdin.read();
    if (data) bufs.push(data);
  });
  stdin.on('end', function() {
    cb(null, Buffer.concat(bufs).toString());
  });
  stdin.on('error', cb);
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

h.printSafeHTTP = function(msg) {
  return msg.replace(/(Cookie\s*:\s*)'.*?'/, '$1<hidden>')
    .replace(/('X-CSRFToken'\s*:\s*)'.*?'/, '$1<hidden>')
    .replace(/('set-cookie'\s*:\s*)\[.*?\]/, '$1<hidden>');
};

module.exports = h;
