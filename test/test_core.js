var assert = require('chai').assert;
var fs = require('fs');
var rewire = require('rewire');

var core = rewire('../lib/core');

// mock depedencies
var h = rewire('../lib/helper');
var cache = rewire('../lib/cache');
var client = rewire('../lib/leetcode_client');

describe('core', function() {
  var home = './tmp';

  before(function() {
    if (!fs.existsSync(home)) fs.mkdirSync(home);

    h.getHomeDir = function() {
      return home;
    };

    cache.__set__('h', h);
    core.__set__('cache', cache);
    core.__set__('client', client);
  });

  describe('#user', function() {
    var USER = {name: 'test-user'};

    it('should login ok', function(done) {
      // before login
      cache.del('.user');
      assert.equal(core.getUser(), null);
      assert.equal(core.isLogin(), false);

      client.login = function(user, cb) {
        return cb(null, user);
      };

      core.login(USER, function(e, user) {
        assert.equal(e, null);
        assert.deepEqual(USER, user);

        // after login
        assert.deepEqual(core.getUser(), user);
        assert.equal(core.isLogin(), true);

        done();
      });
    });

    it('should logout ok', function(done) {
      // before logout
      cache.set('.user', USER);
      assert.deepEqual(core.getUser(), USER);
      assert.equal(core.isLogin(), true);

      // after logout
      core.logout(USER);
      assert.equal(core.getUser(), null);
      assert.equal(core.isLogin(), false);

      done();
    });
  }); // #user

  describe('#problems', function() {
    var PROBLEMS = [
      {id: 0, name: 'name0', key: 'key0'},
      {id: 1, name: 'name1', key: 'key1'}
    ];
    var RESULTS = [
      {name: 'result0'},
      {name: 'result1'}
    ];

    it('should getProblems w/ cache ok', function(done) {
      cache.set('all', PROBLEMS);

      core.getProblems(function(e, problems) {
        assert.equal(e, null);
        assert.deepEqual(problems, PROBLEMS);

        done();
      });
    });

    it('should getProblems w/o cache ok', function(done) {
      cache.del('all');

      client.getProblems = function(cb) {
        return cb(null, PROBLEMS);
      };

      core.getProblems(function(e, problems) {
        assert.equal(e, null);
        assert.deepEqual(problems, PROBLEMS);

        done();
      });
    });

    it('should getProblem by id w/ cache ok', function(done) {
      cache.set('all', PROBLEMS);
      cache.set('key0', PROBLEMS[0]);

      core.getProblem(0, function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);

        done();
      });
    });

    it('should getProblem by name w/ cache ok', function(done) {
      cache.set('all', PROBLEMS);
      cache.set('key0', PROBLEMS[0]);

      core.getProblem('name0', function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);

        done();
      });
    });

    it('should getProblem by key w/ cache ok', function(done) {
      cache.set('all', PROBLEMS);
      cache.set('key0', PROBLEMS[0]);

      core.getProblem('key0', function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);

        done();
      });
    });

    it('should getProblem by id w/o cache ok', function(done) {
      cache.set('all', PROBLEMS);
      cache.del('key0');

      client.getProblem = function(problem, cb) {
        return cb(null, problem);
      };

      core.getProblem(0, function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);

        done();
      });
    });

    it('should getProblem error if not found', function(done) {
      cache.set('all', PROBLEMS);

      core.getProblem(3, function(e, problem) {
        assert.equal(e, 'Problem not found!');
        assert.equal(problem, null);

        done();
      });
    });

    it('should updateProblem ok', function(done) {
      cache.set('all', PROBLEMS);
      cache.del('key0');

      var kv = {name: 'name00', value: 'value0'};
      var ret = core.updateProblem(PROBLEMS[0], kv);
      assert.equal(ret, true);

      core.getProblem(0, function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem,
          {id: 0, name: 'name00', key: 'key0', value: 'value0'});

        done();
      });
    });

    it('should starProblem ok', function(done) {
      client.starProblem = function(problem, cb) {
        return cb(null);
      };

      core.starProblem(PROBLEMS[0], function(e) {
        assert.equal(e, null);
        done();
      });
    });

    // dummy test
    it('should testProblem ok', function(done) {
      client.testProblem = function(problem, cb) {
        return cb(null, RESULTS);
      };

      core.testProblem(PROBLEMS[0], function(e, results) {
        assert.equal(e, null);
        assert.deepEqual(results, RESULTS);

        done();
      });
    });

    // dummy test
    it('should submitProblem ok', function(done) {
      client.submitProblem = function(problem, cb) {
        return cb(null, RESULTS);
      };

      core.submitProblem(PROBLEMS[1], function(e, results) {
        assert.equal(e, null);
        assert.deepEqual(results, RESULTS);

        done();
      });
    });
  }); // #problems

  describe('#submission', function() {
    var SUBMISSIONS = [
      {id: 1234, state: 'Accepted'}
    ];

    // dummy test
    it('should getSubmissions ok', function(done) {
      client.getSubmissions = function(problem, cb) {
        return cb(null, SUBMISSIONS);
      };

      core.getSubmissions({}, function(e, submissions) {
        assert.equal(e, null);
        assert.deepEqual(submissions, SUBMISSIONS);

        done();
      });
    });

    // dummy test
    it('should getSubmission ok', function(done) {
      client.getSubmission = function(submission, cb) {
        return cb(null, SUBMISSIONS[0]);
      };

      core.getSubmission({}, function(e, submission) {
        assert.equal(e, null);
        assert.deepEqual(submission, SUBMISSIONS[0]);

        done();
      });
    });
  }); // #submission
});
