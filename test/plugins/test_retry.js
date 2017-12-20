var assert = require('chai').assert;
var rewire = require('rewire');

var log = require('../../lib/log');

var config = rewire('../../lib/config');
var session = rewire('../../lib/session');
var plugin = rewire('../../lib/plugins/retry');

describe('plugin:retry', function() {
  var USER = {};
  var NEXT = {};
  var PROBLEMS = [{id: 0, name: 'name0'}];

  before(function() {
    log.init();
    config.init();
    plugin.init();

    session.getUser = function() {
      return USER;
    };

    plugin.__set__('config', config);
    plugin.__set__('session', session);
    plugin.setNext(NEXT);
  });

  it('should fail if auto login disabled', function(done) {
    config.autologin.enable = false;
    NEXT.getProblems = function(cb) {
      return cb(session.errors.EXPIRED);
    };

    plugin.getProblems(function(e, problems) {
      assert.equal(e, session.errors.EXPIRED);
      done();
    });
  });

  it('should retry if session expired', function(done) {
    config.autologin.enable = true;

    var n = 0;
    NEXT.getProblems = function(cb) {
      ++n;
      if (n === 1) return cb(session.errors.EXPIRED);
      return cb(null, PROBLEMS);
    };

    NEXT.login = function(user, cb) {
      return cb(null, user);
    };

    plugin.getProblems(function(e, problems) {
      assert.equal(e, null);
      assert.equal(problems, PROBLEMS);
      done();
    });
  });

  it('should fail if user expired locally', function(done) {
    config.autologin.enable = true;

    var n = 0;
    NEXT.getProblems = function(cb) {
      ++n;
      if (n === 1) return cb(session.errors.EXPIRED);
      return cb(null, PROBLEMS);
    };

    session.getUser = function() {
      return null;
    };

    plugin.getProblems(function(e, problems) {
      assert.equal(e, null);
      assert.equal(problems, PROBLEMS);
      done();
    });
  });

  it('should fail if other errors', function(done) {
    config.autologin.enable = true;
    NEXT.getProblems = function(cb) {
      return cb('unknown error');
    };

    plugin.getProblems(function(e, problems) {
      assert.equal(e, 'unknown error');
      done();
    });
  });
});
