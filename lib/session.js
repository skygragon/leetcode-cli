var _ = require('underscore');

var cache = require('./cache');
var config = require('./config');
var h = require('./helper');

var session = {};

session.errors = {
  EXPIRED: {
    msg:        'session expired, please login again',
    statusCode: -1
  }
};

session.getUser = function() {
  return cache.get(h.KEYS.user);
};

session.saveUser = function(user) {
  // when auto login enabled, have to save password to re-login later
  // otherwise don't dump password for the sake of security.
  var _user = _.omit(user, config.autologin.enable ? [] : ['pass']);
  cache.set(h.KEYS.user, _user);
};

session.deleteUser = function() {
  cache.del(h.KEYS.user);
};

session.isLogin = function() {
  return this.getUser() !== null;
};

module.exports = session;
