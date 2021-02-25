var log = require('../log');
var Plugin = require('../plugin');
var session = require('../session');

// [Usage]
//
// https://github.com/skygragon/leetcode-cli-plugins/blob/master/docs/cookie.firefox.md
//
var plugin = new Plugin(13, 'cookie.firefox', '2018.11.19',
    'Plugin to reuse firefox\'s leetcode cookie.',
    ['glob', 'sqlite3']);

function getCookieFile(cb) {
  var f;
  switch (process.platform) {
    case 'darwin':
      f = process.env.HOME + '/Library/Application Support/Firefox/Profiles/*.default*/cookies.sqlite';
      break;
    case 'linux':
      f = process.env.HOME + '/.mozilla/firefox/*.default*/cookies.sqlite';
      break;
    case 'win32':
      f = (process.env.APPDATA || '') + '/Mozilla/Firefox/Profiles/*.default*/cookies.sqlite';
      break;
  }
  require('glob')(f, {}, cb);
}

function getCookies(cb) {
  getCookieFile(function(e, files) {
    if (e || files.length === 0) return cb('Not found cookie file!');

    var sqlite3 = require('sqlite3');
    var db = new sqlite3.Database(files[0]);
    var KEYS = ['csrftoken', 'LEETCODE_SESSION'];

    db.serialize(function() {
      var cookies = {};
      var sql = 'select name, value from moz_cookies where host like "%leetcode.com"';
      db.each(sql, function(e, x) {
        if (e) return cb(e);
        if (KEYS.indexOf(x.name) < 0) return;
        cookies[x.name] = x.value;
      });

      db.close(function() {
        return cb(null, cookies);
      });
    });
  });
}

plugin.signin = function(user, cb) {
  log.debug('running cookie.firefox.signin');
  log.debug('try to copy leetcode cookies from firefox ...');
  getCookies(function(e, cookies) {
    if (e) {
      log.error('Failed to copy cookies: ' + e);
      return plugin.next.signin(user, cb);
    }

    if (!cookies.LEETCODE_SESSION || !cookies.csrftoken) {
      log.error('Got invalid cookies: ' + JSON.stringify(cookies));
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
  log.debug('running cookie.firefox.login');
  plugin.signin(user, function(e, user) {
    if (e) return cb(e);
    plugin.getUser(user, cb);
  });
};

module.exports = plugin;
