'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');

const log = require('../../lib/log');

const config = rewire('../../lib/config');
const session = rewire('../../lib/session');
const plugin = rewire('../../lib/plugins/retry');

describe('plugin:retry', function() {
  const USER = {};
  const NEXT = {};
  const PROBLEMS = [{id: 0, name: 'name0'}];

  before(function() {
    log.init();
    config.init();
    plugin.init();

    session.getUser = () => USER;

    plugin.__set__('config', config);
    plugin.__set__('session', session);
    plugin.setNext(NEXT);
  });

  it('should fail if auto login disabled', function(done) {
    config.autologin.enable = false;
    NEXT.getProblems = cb => cb(session.errors.EXPIRED);

    plugin.getProblems(function(e, problems) {
      assert.equal(e, session.errors.EXPIRED);
      done();
    });
  });

  it('should retry if session expired', function(done) {
    config.autologin.enable = true;

    let n = 0;
    NEXT.getProblems = function(cb) {
      ++n;
      if (n === 1) return cb(session.errors.EXPIRED);
      return cb(null, PROBLEMS);
    };

    NEXT.login = (user, cb) => cb(null, user);

    plugin.getProblems(function(e, problems) {
      assert.equal(e, null);
      assert.equal(problems, PROBLEMS);
      done();
    });
  });

  it('should fail if user expired locally', function(done) {
    config.autologin.enable = true;

    let n = 0;
    NEXT.getProblems = function(cb) {
      ++n;
      if (n === 1) return cb(session.errors.EXPIRED);
      return cb(null, PROBLEMS);
    };

    session.getUser = () => null;

    plugin.getProblems(function(e, problems) {
      assert.equal(e, null);
      assert.equal(problems, PROBLEMS);
      done();
    });
  });

  it('should fail if other errors', function(done) {
    config.autologin.enable = true;
    NEXT.getProblems = cb => cb('unknown error');

    plugin.getProblems(function(e, problems) {
      assert.equal(e, 'unknown error');
      done();
    });
  });
});
