var path = require('path');

var log = require('../log');
var Plugin = require('../plugin');
var Queue = require('../queue');
var session = require('../session');
var config = require('../config');

// [Usage]
//
// https://github.com/skygragon/leetcode-cli-plugins/blob/master/docs/cookie.chrome.md
//
var plugin = new Plugin(13, 'cookie.chrome', '2018.11.18',
    'Plugin to reuse Chrome\'s leetcode cookie.',
    ['ffi:win32', 'keytar:darwin', 'ref:win32', 'ref-struct:win32', 'sqlite3']);

plugin.help = function() {
  switch (process.platform) {
    case 'darwin':
      break;
    case 'linux':
      log.warn('To complete the install: sudo apt install libsecret-tools');
      break;
    case 'win32':
      break;
  }
};

var Chrome = {};

var ChromeMAC = {
  getDBPath: function() {
    return `${process.env.HOME}/Library/Application Support/Google/Chrome/${this.profile}/Cookies`;
  },
  iterations:  1003,
  getPassword: function(cb) {
    var keytar = require('keytar');
    keytar.getPassword('Chrome Safe Storage', 'Chrome').then(cb);
  }
};

var ChromeLinux = {
  getDBPath: function() {
    return `${process.env.HOME}/.config/google-chrome/${this.profile}/Cookies`;
  },
  iterations:  1,
  getPassword: function(cb) {
    // FIXME: keytar failed to read gnome-keyring on ubuntu??
    var cmd = 'secret-tool lookup application chrome';
    var password = require('child_process').execSync(cmd).toString();
    return cb(password);
  }
};

var ChromeWindows = {
  getDBPath: function() {
    return path.resolve(process.env.APPDATA || '', `../Local/Google/Chrome/User Data/${this.profile}/Cookies`);
  },
  getPassword: function(cb) { cb(); }
};

Object.setPrototypeOf(ChromeMAC, Chrome);
Object.setPrototypeOf(ChromeLinux, Chrome);
Object.setPrototypeOf(ChromeWindows, Chrome);

Chrome.getInstance = function() {
  switch (process.platform) {
    case 'darwin': return ChromeMAC;
    case 'linux':  return ChromeLinux;
    case 'win32':  return ChromeWindows;
  }
};
var my = Chrome.getInstance();

ChromeWindows.decodeCookie = function(cookie, cb) {
  var ref = require('ref');
  var ffi = require('ffi');
  var Struct = require('ref-struct');

  var DATA_BLOB = Struct({
    cbData: ref.types.uint32,
    pbData: ref.refType(ref.types.byte)
  });
  var PDATA_BLOB = new ref.refType(DATA_BLOB);
  var Crypto = new ffi.Library('Crypt32', {
    'CryptUnprotectData': ['bool', [PDATA_BLOB, 'string', 'string', 'void *', 'string', 'int', PDATA_BLOB]]
  });

  var inBlob = new DATA_BLOB();
  inBlob.pbData = cookie;
  inBlob.cbData = cookie.length;
  var outBlob = ref.alloc(DATA_BLOB);

  Crypto.CryptUnprotectData(inBlob.ref(), null, null, null, null, 0, outBlob);
  var outDeref = outBlob.deref();
  var buf = ref.reinterpret(outDeref.pbData, outDeref.cbData, 0);

  return cb(null, buf.toString('utf8'));
};

Chrome.decodeCookie = function(cookie, cb) {
  var crypto = require('crypto');
  crypto.pbkdf2(my.password, 'saltysalt', my.iterations, 16, 'sha1', function(e, key) {
    if (e) return cb(e);

    var iv = new Buffer(' '.repeat(16));
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(false);

    var buf = decipher.update(cookie.slice(3)); // remove prefix "v10" or "v11"
    var final = decipher.final();
    final.copy(buf, buf.length - 1);

    var padding = buf[buf.length - 1];
    if (padding) buf = buf.slice(0, buf.length - padding);

    return cb(null, buf.toString('utf8'));
  });
};

function doDecode(key, queue, cb) {
  var ctx = queue.ctx;
  var cookie = ctx[key];
  if (!cookie) return cb('Not found cookie: ' + key);

  my.decodeCookie(cookie, function(e, cookie) {
    ctx[key] = cookie;
    return cb();
  });
}

Chrome.getCookies = function(cb) {
  var sqlite3 = require('sqlite3');
  var db = new sqlite3.Database(my.getDBPath());
  db.on('error', cb);
  var KEYS = ['csrftoken', 'LEETCODE_SESSION'];

  let host = config.sys.cookie_host;
  if (!host) {
    host = 'leetcode.com';      // default host key
  }

  db.serialize(function() {
    var cookies = {};
    var sql = 'select name, encrypted_value from cookies where host_key like "%' + host +'"';
    db.each(sql, function(e, x) {
      if (e) return cb(e);
      if (KEYS.indexOf(x.name) < 0) return;
      cookies[x.name] = x.encrypted_value;
    });

    db.close(function() {
      my.getPassword(function(password) {
        my.password = password;
        var q = new Queue(KEYS, cookies, doDecode);
        q.run(null, cb);
      });
    });
  });
};

plugin.signin = function(user, cb) {
  log.debug('running cookie.chrome.signin');
  log.debug('try to copy leetcode cookies from chrome ...');

  my.profile = plugin.config.profile || 'Default';
  my.getCookies(function(e, cookies) {
    if (e) {
      log.error(`Failed to copy cookies from profile "${my.profile}"`);
      log.error(e);
      return plugin.next.signin(user, cb);
    }

    log.debug('Successfully copied leetcode cookies!');
    user.sessionId = cookies.LEETCODE_SESSION;
    user.sessionCSRF = cookies.csrftoken;
    session.saveUser(user);
    return cb(null, user);
  });
};

plugin.login = function(user, cb) {
  log.debug('running cookie.chrome.login');
  plugin.signin(user, function(e, user) {
    if (e) return cb(e);
    plugin.getUser(user, cb);
  });
};

module.exports = plugin;
