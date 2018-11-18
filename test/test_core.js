'use strict';
const assert = require('chai').assert;
const rewire = require('rewire');

describe('core', function() {
  let core;
  let next;

  const PROBLEMS = [
    {
      category: 'algorithms',
      id:       0,
      fid:      0,
      name:     'name0',
      slug:     'slug0',
      level:    'Hard',
      locked:   true,
      starred:  false,
      state:    'ac',
      tags:     ['google', 'facebook']
    },
    {
      category:  'algorithms',
      companies: ['amazon', 'facebook'],
      id:        1,
      fid:       1,
      name:      'name1',
      slug:      'slug1',
      level:     'Easy',
      locked:    false,
      starred:   true,
      state:     'none'
    }
  ];

  before(function() {
    const log = require('../lib/log');
    log.init();
  });

  beforeEach(function() {
    next = {};
    next.getProblems = cb => cb(null, PROBLEMS);
    next.getProblem = (p, cb) => cb(null, p);

    core = rewire('../lib/core');
    core.setNext(next);
  });

  describe('#filterProblems', function() {
    it('should filter by query ok', function(done) {
      const cases = [
        ['',     [0, 1]],
        ['x',    [0, 1]],
        ['h',    [0]],
        ['H',    [1]],
        ['m',    []],
        ['M',    [0, 1]],
        ['l',    [0]],
        ['L',    [1]],
        ['s',    [1]],
        ['S',    [0]],
        ['d',    [0]],
        ['D',    [1]],
        ['eLsD', [1]],
        ['Dh',   []]
      ];
      let n = cases.length;

      for (let x of cases) {
        core.filterProblems({query: x[0]}, function(e, problems) {
          assert.notExists(e);
          assert.equal(problems.length, x[1].length);

          for (let i = 0; i < problems.length; ++i)
            assert.equal(problems[i], PROBLEMS[x[1][i]]);
          if (--n === 0) done();
        });
      }
    });

    it('should filter by tag ok', function(done) {
      const cases = [
        [[],           [0, 1]],
        [['facebook'], [0, 1]],
        [['google'],   [0]],
        [['amazon'],   [1]],
        [['apple'],    []],
      ];
      let n = cases.length;

      for (let x of cases) {
        core.filterProblems({tag: x[0]}, function(e, problems) {
          assert.notExists(e);
          assert.equal(problems.length, x[1].length);

          for (let i = 0; i < problems.length; ++i)
            assert.equal(problems[i], PROBLEMS[x[1][i]]);
          if (--n === 0) done();
        });
      }
    });

    it('should fail if getProblems error', function(done) {
      next.getProblems = cb => cb('getProblems error');
      core.filterProblems({}, function(e) {
        assert.equal(e, 'getProblems error');
        done();
      });
    });
  }); // #filterProblems

  describe('#starProblem', function() {
    it('should ok', function(done) {
      next.starProblem = (p, starred, cb) => cb(null, starred);

      assert.equal(PROBLEMS[0].starred, false);
      core.starProblem(PROBLEMS[0], true, function(e, starred) {
        assert.notExists(e);
        assert.equal(starred, true);
        done();
      });
    });

    it('should ok if already starred', function(done) {
      assert.equal(PROBLEMS[1].starred, true);
      core.starProblem(PROBLEMS[1], true, function(e, starred) {
        assert.notExists(e);
        assert.equal(starred, true);
        done();
      });
    });

    it('should ok if already unstarred', function(done) {
      assert.equal(PROBLEMS[0].starred, false);
      core.starProblem(PROBLEMS[0], false, function(e, starred) {
        assert.notExists(e);
        assert.equal(starred, false);
        done();
      });
    });
  }); // #starProblem

  describe('#exportProblem', function() {
    it('should codeonly ok', function() {
      const expected = [
        '/**',
        ' * Definition for singly-linked list.',
        ' * struct ListNode {',
        ' *     int val;',
        ' *     ListNode *next;',
        ' *     ListNode(int x) : val(x), next(NULL) {}',
        ' * };',
        ' */',
        'class Solution {',
        'public:',
        '    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {',
        '        ',
        '    }',
        '};',
        ''
      ].join('\n');

      const problem = require('./mock/add-two-numbers.20161015.json');
      const opts = {
        lang: 'cpp',
        code: problem.templates[0].defaultCode,
        tpl:  'codeonly'
      };
      assert.equal(core.exportProblem(problem, opts), expected);
    });

    it('should codeonly ok in windows', function() {
      const file = rewire('../lib/file');
      file.isWindows = () => true;
      core.__set__('file', file);

      const expected = [
        '/**',
        ' * Definition for singly-linked list.',
        ' * struct ListNode {',
        ' *     int val;',
        ' *     ListNode *next;',
        ' *     ListNode(int x) : val(x), next(NULL) {}',
        ' * };',
        ' */',
        'class Solution {',
        'public:',
        '    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {',
        '        ',
        '    }',
        '};',
        ''
      ].join('\r\n');

      const problem = require('./mock/add-two-numbers.20161015.json');
      const opts = {
        lang: 'cpp',
        code: problem.templates[0].defaultCode,
        tpl:  'codeonly'
      };
      assert.equal(core.exportProblem(problem, opts), expected);
    });

    it('should detailed ok with cpp', function() {
      const expected = [
        '/*',
        ' * @lc app=leetcode id=2 lang=cpp',
        ' *',
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
        '/**',
        ' * Definition for singly-linked list.',
        ' * struct ListNode {',
        ' *     int val;',
        ' *     ListNode *next;',
        ' *     ListNode(int x) : val(x), next(NULL) {}',
        ' * };',
        ' */',
        'class Solution {',
        'public:',
        '    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {',
        '        ',
        '    }',
        '};',
        ''
      ].join('\n');

      const problem = require('./mock/add-two-numbers.20161015.json');
      const opts = {
        lang: 'cpp',
        code: problem.templates[0].defaultCode,
        tpl:  'detailed'
      };
      assert.equal(core.exportProblem(problem, opts), expected);
    });

    it('should detailed ok with ruby', function() {
      const expected = [
        '#',
        '# @lc app=leetcode id=2 lang=ruby',
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

      const problem = require('./mock/add-two-numbers.20161015.json');
      problem.testcase = null;
      const opts = {
        lang: 'ruby',
        code: problem.templates[6].defaultCode,
        tpl:  'detailed'
      };
      assert.equal(core.exportProblem(problem, opts), expected);
    });
  }); // #exportProblem

  describe('#getProblem', function() {
    it('should get by id ok', function(done) {
      core.getProblem(0, function(e, problem) {
        assert.notExists(e);
        assert.deepEqual(problem, PROBLEMS[0]);
        done();
      });
    });

    it('should get by key ok', function(done) {
      core.getProblem('slug0', function(e, problem) {
        assert.notExists(e);
        assert.deepEqual(problem, PROBLEMS[0]);
        done();
      });
    });

    it('should fail if not found', function(done) {
      core.getProblem(3, function(e, problem) {
        assert.equal(e, 'Problem not found!');
        done();
      });
    });

    it('should fail if client error', function(done) {
      next.getProblem = (problem, cb) => cb('client getProblem error');

      core.getProblem(0, function(e, problem) {
        assert.equal(e, 'client getProblem error');
        done();
      });
    });

    it('should ok if problem is already there', function(done) {
      core.getProblem(PROBLEMS[1], function(e, problem) {
        assert.notExists(e);
        assert.deepEqual(problem, PROBLEMS[1]);
        done();
      });
    });

    it('should fail if getProblems error', function(done) {
      next.getProblems = cb => cb('getProblems error');

      core.getProblem(0, function(e, problem) {
        assert.equal(e, 'getProblems error');
        done();
      });
    });
  }); // #getProblem
});
