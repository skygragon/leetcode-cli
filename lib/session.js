'use strict';
var moment = require('moment');
var _ = require('underscore');

var cache = require('./cache');
var config = require('./config');
var h = require('./helper');

const session = {};

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
  const _user = _.omit(user, config.autologin.enable ? [] : ['pass']);
  cache.set(h.KEYS.user, _user);
};

session.deleteUser = function() {
  cache.del(h.KEYS.user);
};

session.deleteCodingSession = function() {
  cache.del(h.KEYS.problems);
};

session.isLogin = function() {
  return this.getUser() !== null;
};

session.updateStat = function(k, v) {
  // TODO: use other storage if too many stat data
  const today = moment().format('YYYY-MM-DD');
  const stats = cache.get(h.KEYS.stat) || {};
  const stat = stats[today] = stats[today] || {};

  if (k.endsWith('.set')) {
    const s = new Set(stat[k] || []);
    s.add(v);
    stat[k] = Array.from(s);
  } else {
    stat[k] = (stat[k] || 0) + v;
  }

  cache.set(h.KEYS.stat, stats);
};

module.exports = session;
