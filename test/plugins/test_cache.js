var execSync = require('child_process').execSync;
var fs = require('fs');

var _ = require('underscore');
var assert = require('chai').assert;
var rewire = require('rewire');

var log = require('../../lib/log');
var config = require('../../lib/config');

var cache = rewire('../../lib/cache');
var h = rewire('../../lib/helper');
var session = rewire('../../lib/session');
var plugin = rewire('../../lib/plugins/cache');

var HOME = './tmp';

describe('plugin:cache', function() {
  var PROBLEMS = [
    {id: 0, name: 'name0', slug: 'slug0', starred: false, category: 'algorithms'},
    {id: 1, name: 'name1', slug: 'slug1', starred: true, category: 'algorithms'}
  ];
  var PROBLEM = {id: 0, slug: 'slug0', category: 'algorithms'};

  var NEXT = {};

  before(function() {
    log.init();
    config.init();
    plugin.init();

    h.getCacheDir = function() {
      return HOME;
    };
    cache.__set__('h', h);
    cache.init();

    session.__set__('cache', cache);
    plugin.__set__('cache', cache);
    plugin.__set__('session', session);
    plugin.setNext(NEXT);
  });

  beforeEach(function() {
    execSync('rm -rf ' + HOME);
    fs.mkdirSync(HOME);
  });

  describe('#getProblems', function() {
    it('should getProblems w/ cache ok', function(done) {
      cache.set('problems', PROBLEMS);

      plugin.getProblems(function(e, problems) {
        assert.equal(e, null);
        assert.deepEqual(problems, PROBLEMS);
        done();
      });
    });

    it('should getProblems w/o cache ok', function(done) {
      cache.del('problems');

      NEXT.getProblems = function(cb) {
        return cb(null, PROBLEMS);
      };

      plugin.getProblems(function(e, problems) {
        assert.equal(e, null);
        assert.deepEqual(problems, PROBLEMS);
        done();
      });
    });

    it('should getProblems w/o cache fail if client error', function(done) {
      cache.del('problems');

      NEXT.getProblems = function(cb) {
        return cb('client getProblems error');
      };

      plugin.getProblems(function(e, problems) {
        assert.equal(e, 'client getProblems error');
        done();
      });
    });
  }); // #getProblems

  describe('#getProblem', function() {
    it('should getProblem w/ cache ok', function(done) {
      cache.set('problems', PROBLEMS);
      cache.set('0.slug0.algorithms', PROBLEMS[0]);

      plugin.getProblem(_.clone(PROBLEM), function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);
        done();
      });
    });

    it('should getProblem w/o cache ok', function(done) {
      cache.set('problems', PROBLEMS);
      cache.del('0.slug0.algorithms');

      NEXT.getProblem = function(problem, cb) {
        return cb(null, PROBLEMS[0]);
      };

      plugin.getProblem(_.clone(PROBLEM), function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);
        done();
      });
    });

    it('should getProblem fail if client error', function(done) {
      cache.set('problems', PROBLEMS);
      cache.del('0.slug0.algorithms');

      NEXT.getProblem = function(problem, cb) {
        return cb('client getProblem error');
      };

      plugin.getProblem(_.clone(PROBLEM), function(e, problem) {
        assert.equal(e, 'client getProblem error');
        done();
      });
    });
  }); // #getProblem

  describe('#saveProblem', function() {
    it('should ok', function() {
      cache.del('0.slug0.algorithms');

      var problem = _.clone(PROBLEMS[0]);
      problem.locked = true;
      problem.state = 'ac';

      var ret = plugin.saveProblem(problem);
      assert.equal(ret, true);
      assert.deepEqual(cache.get('0.slug0.algorithms'),
          {id: 0, slug: 'slug0', name: 'name0', category: 'algorithms'});
    });
  }); // #saveProblem

  describe('#updateProblem', function() {
    it('should updateProblem ok', function(done) {
      cache.set('problems', PROBLEMS);

      var kv = {value: 'value00'};
      var ret = plugin.updateProblem(PROBLEMS[0], kv);
      assert.equal(ret, true);

      plugin.getProblems(function(e, problems) {
        assert.equal(e, null);
        assert.deepEqual(problems, [
            {id: 0, name: 'name0', slug: 'slug0', value: 'value00', starred: false, category: 'algorithms'},
            {id: 1, name: 'name1', slug: 'slug1', starred: true, category: 'algorithms'}
        ]);
        done();
      });
    });

    it('should updateProblem fail if no problems found', function() {
      cache.del('problems');
      var ret = plugin.updateProblem(PROBLEMS[0], {});
      assert.equal(ret, false);
    });

    it('should updateProblem fail if unknown problem', function() {
      cache.set('problems', [PROBLEMS[1]]);
      var ret = plugin.updateProblem(PROBLEMS[0], {});
      assert.equal(ret, false);
    });
  }); // #updateProblem

  describe('#user', function() {
    var USER = {name: 'test-user', pass: 'password'};
    var USER_SAFE = {name: 'test-user'};

    it('should login ok', function(done) {
      config.autologin.enable = true;
      // before login
      cache.del(h.KEYS.user);
      assert.equal(session.getUser(), null);
      assert.equal(session.isLogin(), false);

      NEXT.login = function(user, cb) {
        return cb(null, user);
      };

      plugin.login(USER, function(e, user) {
        assert.equal(e, null);
        assert.deepEqual(user, USER);

        // after login
        assert.deepEqual(session.getUser(), USER);
        assert.equal(session.isLogin(), true);
        done();
      });
    });

    it('should login ok w/ auto login', function(done) {
      config.autologin.enable = false;
      cache.del(h.KEYS.user);

      NEXT.login = function(user, cb) {
        return cb(null, user);
      };

      plugin.login(USER, function(e, user) {
        assert.equal(e, null);
        assert.deepEqual(user, USER);
        assert.deepEqual(session.getUser(), USER_SAFE);
        assert.equal(session.isLogin(), true);
        done();
      });
    });

    it('should login fail if client login error', function(done) {
      NEXT.login = function(user, cb) {
        return cb('client login error');
      };

      plugin.login(USER, function(e, user) {
        assert.equal(e, 'client login error');
        done();
      });
    });

    it('should logout ok', function(done) {
      // before logout
      cache.set(h.KEYS.user, USER);
      assert.deepEqual(session.getUser(), USER);
      assert.equal(session.isLogin(), true);

      // after logout
      plugin.logout(USER, true);
      assert.equal(session.getUser(), null);
      assert.equal(session.isLogin(), false);
      done();
    });
  }); // #user
});
