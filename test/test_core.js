var fs = require('fs');

var _ = require('underscore');
var assert = require('chai').assert;
var rewire = require('rewire');

var log = require('../lib/log');

var session = rewire('../lib/session');
var plugin = rewire('../lib/core');

describe('core', function() {
  var PROBLEMS = [
    {id: 0, name: 'name0', slug: 'slug0', starred: false, category: 'algorithms'},
    {id: 1, name: 'name1', slug: 'slug1', starred: true, category: 'algorithms'}
  ];
  var USER = {};
  var NEXT = {};

  before(function() {
    log.init();

    session.getUser = function() {
      return USER;
    };

    plugin.__set__('session', session);
    plugin.setNext(NEXT);
  });

  beforeEach(function() {
    NEXT.getProblems = function(cb) {
      return cb(null, PROBLEMS);
    };
    NEXT.getProblem = function(problem, cb) {
      return cb(null, problem);
    };
  });

  describe('#starProblem', function() {
    it('should starProblem ok', function(done) {
      NEXT.starProblem = function(problem, starred, cb) {
        return cb(null, starred);
      };

      assert.equal(PROBLEMS[0].starred, false);
      plugin.starProblem(PROBLEMS[0], true, function(e, starred) {
        assert.equal(e, null);
        assert.equal(starred, true);
        done();
      });
    });

    it('should starProblem ok if already starred', function(done) {
      assert.equal(PROBLEMS[1].starred, true);
      plugin.starProblem(PROBLEMS[1], true, function(e, starred) {
        assert.equal(e, null);
        assert.equal(starred, true);
        done();
      });
    });

    it('should starProblem ok if already unstarred', function(done) {
      assert.equal(PROBLEMS[0].starred, false);
      plugin.starProblem(PROBLEMS[0], false, function(e, starred) {
        assert.equal(e, null);
        assert.equal(starred, false);
        done();
      });
    });
  }); // #starProblem

  describe('#exportProblem', function() {
    function injectVerify(expected, done) {
      plugin.__set__('fs', {
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
      ].join('\n');

      injectVerify(expected, done);

      var problem = require('./mock/add-two-numbers.20161015.json');
      plugin.exportProblem(problem, 'test.cpp', true);
    });

    it('should ok w/ detailed comments', function(done) {
      var expected = [
        '/*',
        ' * [2] Add Two Numbers',
        ' *',
        ' * https://leetcode.com/problems/add-two-numbers',
        ' *',
        ' * algorithms',
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
      ].join('\n');

      injectVerify(expected, done);

      var problem = require('./mock/add-two-numbers.20161015.json');
      plugin.exportProblem(problem, 'test.cpp', false);
    });

    it('should ok w/ detailed comments, 2nd', function(done) {
      var expected = [
        '#',
        '# [2] Add Two Numbers',
        '#',
        '# https://leetcode.com/problems/add-two-numbers',
        '#',
        '# algorithms',
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
      ].join('\n');

      injectVerify(expected, done);

      var problem = require('./mock/add-two-numbers.20161015.json');
      problem.testcase = null;
      problem.code = _.find(problem.templates, function(template) {
        return template.value === 'ruby';
      }).defaultCode;
      plugin.exportProblem(problem, 'test.rb', false);
    });
  }); // #exportProblem

  describe('#getProblem', function() {
    it('should getProblem by id ok', function(done) {
      plugin.getProblem(0, function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);
        done();
      });
    });

    it('should getProblem by key ok', function(done) {
      plugin.getProblem('slug0', function(e, problem) {
        assert.equal(e, null);
        assert.deepEqual(problem, PROBLEMS[0]);
        done();
      });
    });

    it('should getProblem error if not found', function(done) {
      plugin.getProblem(3, function(e, problem) {
        assert.equal(e, 'Problem not found!');
        done();
      });
    });

    it('should getProblem fail if client error', function(done) {
      NEXT.getProblem = function(problem, cb) {
        return cb('client getProblem error');
      };

      plugin.getProblem(0, function(e, problem) {
        assert.equal(e, 'client getProblem error');
        done();
      });
    });

    it('should getProblem fail if getProblems error', function(done) {
      NEXT.getProblems = function(cb) {
        return cb('getProblems error');
      };

      plugin.getProblem(0, function(e, problem) {
        assert.equal(e, 'getProblems error');
        done();
      });
    });
  }); // #getProblem
});
