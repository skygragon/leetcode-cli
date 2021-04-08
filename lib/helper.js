'use strict';
var _ = require('underscore');
var ora = require('ora');

var file = require('./file');

const UNITS_SIZE = [
  {unit: 'B', name: 'Bytes',  count: 1024},
  {unit: 'K', name: 'KBytes', count: 1024},
  {unit: 'M', name: 'MBytes', count: 1024},
  {unit: 'G', name: 'GBytes', count: -1}
];

const UNITS_TIME = [
  {unit: 's', name: 'seconds', count: 60},
  {unit: 'm', name: 'minutes', count: 60},
  {unit: 'h', name: 'hours',   count: 24},
  {unit: 'd', name: 'days',    count: 7},
  {unit: 'w', name: 'weeks',   count: 4},
  {unit: 'm', name: 'months',  count: 12},
  {unit: 'y', name: 'years',   count: -1}
];

function getUnit(units, v) {
  for (let i = 0; i < units.length; ++i) {
    if (units[i].count <= 0 || v < units[i].count)
      return [v, units[i]];
    v /= units[i].count;
  }
}

const LANGS = [
  {lang: 'bash',       ext: '.sh',         style: '#'},
  {lang: 'c',          ext: '.c',          style: 'c'},
  {lang: 'cpp',        ext: '.cpp',        style: 'c'},
  {lang: 'csharp',     ext: '.cs',         style: 'c'},
  {lang: 'golang',     ext: '.go',         style: 'c'},
  {lang: 'java',       ext: '.java',       style: 'c'},
  {lang: 'javascript', ext: '.js',         style: 'c'},
  {lang: 'kotlin',     ext: '.kt',         style: 'c'},
  {lang: 'mysql',      ext: '.sql',        style: '--'},
  {lang: 'php',        ext: '.php',        style: 'c'},
  {lang: 'python',     ext: '.py',         style: '#'},
  {lang: 'python3',    ext: '.py',         style: '#'},
  {lang: 'ruby',       ext: '.rb',         style: '#'},
  {lang: 'rust',       ext: '.rs',         style: 'c'},
  {lang: 'scala',      ext: '.scala',      style: 'c'},
  {lang: 'swift',      ext: '.swift',      style: 'c'},
  {lang: 'typescript', ext: '.ts',         style: 'c'}
];

const h = {};

h.KEYS = {
  user:        '../user',
  stat:        '../stat',
  plugins:     '../../plugins',
  problems:    'problems',
  translation: 'translationConfig',
  problem:     p => p.fid + '.' + p.slug + '.' + p.category
};

h.prettyState = function(state) {
  switch (state) {
    case 'ac':    return this.prettyText('', true);
    case 'notac': return this.prettyText('', false);
    default:      return ' ';
  }
};

h.prettyText = function(text, yesNo) {
  const chalk = require('./chalk');
  const icon = require('./icon');
  switch (yesNo) {
    case true:  return chalk.green(icon.yes + text);
    case false: return chalk.red(icon.no + text);
    default:    return text;
  }
};

h.prettySize = function(n) {
  const res = getUnit(UNITS_SIZE, n);
  return res[0].toFixed(2) + res[1].unit;
};

h.prettyTime = function(n) {
  const res = getUnit(UNITS_TIME, n);
  return res[0].toFixed(0) + ' ' + res[1].name;
};

h.prettyLevel = function(level) {
  const chalk = require('./chalk');
  switch (level.toLowerCase().trim()) {
    case 'easy':   return chalk.green(level);
    case 'medium': return chalk.yellow(level);
    case 'hard':   return chalk.red(level);
    default:       return level;
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
  const res = LANGS.find(x => x.lang === lang);
  return res ? res.ext : '.raw';
};

h.extToLang = function(fullpath) {
  const res = LANGS.find(x => fullpath.endsWith(x.ext));
  return res ? res.lang : 'unknown';
};

h.langToCommentStyle = function(lang) {
  const res = LANGS.find(x => x.lang === lang);

  return (res && res.style === 'c') ?
    {start: '/*', line: ' *', end: ' */', singleLine: '//'} :
    {start: res.style,  line: res.style,  end: res.style, singleLine: res.style};
};

h.readStdin = function(cb) {
  const stdin = process.stdin;
  const bufs = [];

  console.log('NOTE: to finish the input, press ' +
      (file.isWindows() ? '<Ctrl-D> and <Return>' : '<Ctrl-D>'));

  stdin.on('readable', function() {
    const data = stdin.read();
    if (data) {
      // windows doesn't treat ctrl-D as EOF
      if (file.isWindows() && data.toString() === '\x04\r\n') {
        stdin.emit('end');
      } else {
        bufs.push(data);
      }
    }
  });
  stdin.on('end', function() {
    cb(null, Buffer.concat(bufs).toString());
  });
  stdin.on('error', cb);
};

h.getSetCookieValue = function(resp, key) {
  const cookies = resp.headers['set-cookie'];
  if (!cookies) return null;

  for (let i = 0; i < cookies.length; ++i) {
    const sections = cookies[i].split(';');
    for (let j = 0; j < sections.length; ++j) {
      const kv = sections[j].trim().split('=');
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

h.spin = function(s) {
  return ora(require('./chalk').gray(s)).start();
};

const COLORS = {
  blue:    {fg: 'white', bg: 'bgBlue'},
  cyan:    {fg: 'white', bg: 'bgCyan'},
  gray:    {fg: 'white', bg: 'bgGray'},
  green:   {fg: 'black', bg: 'bgGreen'},
  magenta: {fg: 'white', bg: 'bgMagenta'},
  red:     {fg: 'white', bg: 'bgRed'},
  yellow:  {fg: 'black', bg: 'bgYellow'},
  white:   {fg: 'black', bg: 'bgWhite'}
};
h.badge = function(s, color) {
  s = ' ' + s + ' ';
  if (color === 'random')
    color = _.chain(COLORS).keys().sample().value();
  const c = COLORS[color || 'blue'];

  const chalk = require('./chalk');
  return chalk[c.fg][c.bg](s);
};

module.exports = h;
