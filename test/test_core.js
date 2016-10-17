var execSync = require('child_process').execSync;
var fs = require('fs');

var _ = require('underscore');
var assert = require('chai').assert;
var rewire = require('rewire');

// mock depedencies
var cache = rewire('../lib/cache');
var client = rewire('../lib/leetcode_client');
var config = rewire('../lib/config');
var core = rewire('../lib/core');
var h = rewire('../lib/helper');

describe('core', function() {
  before(function() {
    var home = './tmp';
    execSync('rm -rf ' + home);
    fs.mkdirSync(home);

    h.getHomeDir = function() {
      return home;
    };

    cache.__set__('h', h);
    core.__set__('cache', cache);
    core.__set__('client', client);
    core.__set__('config', config);
  });

  describe('#user', function() {
    var USER = {name: 'test-user', pass: 'password'};
    var SAFE_USER = {name: 'test-user'};

    it('should login ok', function(done) {
      config.AUTO_LOGIN = true;
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

    it('should login ok w/ auto login', function(done) {
      config.AUTO_LOGIN = false;
      cache.del('.user');

      client.login = function(user, cb) {
        return cb(null, user);
      };

      core.login(USER, function(e, user) {
        assert.equal(e, null);
        assert.deepEqual(USER, user);
        assert.deepEqual(SAFE_USER, core.getUser());
        assert.equal(core.isLogin(), true);
        done();
      });
    });

    it('should login fail if client login error', function(done) {
      client.login = function(user, cb) {
        return cb('client login error');
      };

      core.login(USER, function(e, user) {
        assert.equal(e, 'client login error');
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
      {id: 0, name: 'name0', key: 'key0', starred: false},
      {id: 1, name: 'name1', key: 'key1', starred: true}
    ];
    var RESULTS = [
      {name: 'result0'},
      {name: 'result1'}
    ];

    describe('#getProblems', function() {
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

      it('should getProblems w/o cache fail if client error', function(done) {
        cache.del('all');

        client.getProblems = function(cb) {
          return cb('client getProblems error');
        };

        core.getProblems(function(e, problems) {
          assert.equal(e, 'client getProblems error');
          done();
        });
      });
    }); // #getProblems

    describe('#getProblem', function() {
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
          done();
        });
      });

      it('should getProblem fail if client error', function(done) {
        cache.set('all', PROBLEMS);
        cache.del('key0');

        client.getProblem = function(problem, cb) {
          return cb('client getProblem error');
        };

        core.getProblem(0, function(e, problem) {
          assert.equal(e, 'client getProblem error');
          done();
        });
      });

      it('should getProblem fail if getProblems error', function(done) {
        cache.del('all');
        client.getProblems = function(cb) {
          return cb('getProblems error');
        };

        core.getProblem(0, function(e, problem) {
          assert.equal(e, 'getProblems error');
          done();
        });
      });
    }); // #getProblem

    describe('#updateProblem', function() {
      it('should updateProblem ok', function(done) {
        cache.set('all', PROBLEMS);
        cache.del('key0');

        var kv = {value: 'value00'};
        var ret = core.updateProblem(PROBLEMS[0], kv);
        assert.equal(ret, true);

        core.getProblem(0, function(e, problem) {
          assert.equal(e, null);
          assert.deepEqual(problem,
            {id: 0, name: 'name0', key: 'key0', value: 'value00', starred: false});
          done();
        });
      });

      it('should updateProblem fail if no problems found', function() {
        cache.del('all');
        var ret = core.updateProblem(PROBLEMS[0], {});
        assert.equal(ret, false);
      });

      it('should updateProblem fail if unknown problem', function() {
        cache.set('all', [PROBLEMS[1]]);
        var ret = core.updateProblem(PROBLEMS[0], {});
        assert.equal(ret, false);
      });
    }); // #updateProblem

    describe('#starProblem', function() {
      it('should starProblem ok', function(done) {
        client.starProblem = function(problem, starred, cb) {
          return cb(null, starred);
        };

        assert.equal(PROBLEMS[0].starred, false);
        core.starProblem(PROBLEMS[0], true, function(e, starred) {
          assert.equal(e, null);
          assert.equal(starred, true);
          done();
        });
      });

      it('should starProblem ok if already starred', function(done) {
        assert.equal(PROBLEMS[1].starred, true);
        core.starProblem(PROBLEMS[1], true, function(e, starred) {
          assert.equal(e, null);
          assert.equal(starred, true);
          done();
        });
      });

      it('should starProblem ok if already unstarred', function(done) {
        assert.equal(PROBLEMS[0].starred, false);
        core.starProblem(PROBLEMS[0], false, function(e, starred) {
          assert.equal(e, null);
          assert.equal(starred, false);
          done();
        });
      });
    }); // #starProblem

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

    describe('#exportProblem', function() {
      function injectVerify(expected, done) {
        core.__set__('fs', {
          writeFileSync: function(f, data) {
            assert.equal(data, expected);
            done();
          },
          readFileSync: fs.readFileSync
        });
      }

      it('should ok w/ code only', function(done) {
        var expected = [
          'class Solution {',
          'public:',
          '    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {',
          '',
          '    }',
          '};'
        ].join('\r\n');

        injectVerify(expected, done);

        var problem = require('./mock/add-two-numbers.20161015.json');
        core.exportProblem(problem, 'test.cpp', true);
      });

      it('should ok w/ detailed comments', function(done) {
        var expected = [
          '/*',
          ' * [2] Add Two Numbers',
          ' *',
          ' * https://leetcode.com/problems/add-two-numbers',
          ' *',
          ' * Medium (25.37%)',
          ' * Total Accepted:    195263',
          ' * Total Submissions: 769711',
          ' * Testcase Example:  \'[2,4,3]\\n[5,6,4]\'',
          ' *',
          ' * You are given two linked lists representing two non-negative numbers. The',
          ' * digits are stored in reverse order and each of their nodes contain a single',
          ' * digit. Add the two numbers and return it as a linked list.',
          ' * ',
          ' * Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)',
          ' * Output: 7 -> 0 -> 8',
          ' */',
          'class Solution {',
          'public:',
          '    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {',
          '',
          '    }',
          '};',
          ''
        ].join('\r\n');

        injectVerify(expected, done);

        var problem = require('./mock/add-two-numbers.20161015.json');
        core.exportProblem(problem, 'test.cpp', false);
      });

      it('should ok w/ detailed comments, 2nd', function(done) {
        var expected = [
          '#',
          '# [2] Add Two Numbers',
          '#',
          '# https://leetcode.com/problems/add-two-numbers',
          '#',
          '# Medium (25.37%)',
          '# Total Accepted:    195263',
          '# Total Submissions: 769711',
          '# Testcase Example:  \'\'',
          '#',
          '# You are given two linked lists representing two non-negative numbers. The',
          '# digits are stored in reverse order and each of their nodes contain a single',
          '# digit. Add the two numbers and return it as a linked list.',
          '# ',
          '# Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)',
          '# Output: 7 -> 0 -> 8',
          '#',
          '# Definition for singly-linked list.',
          '# class ListNode',
          '#     attr_accessor :val, :next',
          '#     def initialize(val)',
          '#         @val = val',
          '#         @next = nil',
          '#     end',
          '# end',
          '',
          '# @param {ListNode} l1',
          '# @param {ListNode} l2',
          '# @return {ListNode}',
          'def add_two_numbers(l1, l2)',
          '    ',
          'end',
          ''
        ].join('\r\n');

        injectVerify(expected, done);

        var problem = require('./mock/add-two-numbers.20161015.json');
        problem.testcase = null;
        problem.code = _.find(problem.templates, function(template) {
          return template.value === 'ruby';
        }).defaultCode;
        core.exportProblem(problem, 'test.rb', false);
      });
    }); // #exportProblem
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
