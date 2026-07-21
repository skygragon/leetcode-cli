'use strict';
const _ = require('underscore');
const assert = require('assert').strict;
const nock = require('nock');
const rewire = require('rewire');

const config = require('../../lib/config');
const chalk = require('../../lib/chalk');
const log = require('../../lib/log');

const plugin = rewire('../../lib/plugins/leetcode');
const session = rewire('../../lib/session');

describe('plugin:leetcode', function() {
  const USER = {hash: 'abcdef'};
  const PROBLEM = {
    id:     389,
    name:   'Find the Difference',
    slug:   'find-the-difference',
    link:   'https://leetcode.com/problems/find-the-difference',
    locked: false,
    file:   '/dev/null'
  };
  const SUBMISSION = {
    id:      '73790064',
    lang:    'cpp',
    runtime: '9 ms',
    path:    '/submissions/detail/73790064/',
    state:   'Accepted'
  };

  before(function() {
    log.init();
    config.init();
    chalk.init();
    plugin.init();

    session.getUser = () => USER;
    session.saveUser = () => {};
    plugin.__set__('session', session);
  });

  describe('#login', function() {
    it('should ok', function(done) {
      nock('https://leetcode.com')
        .get('/accounts/login/')
        .reply(200, '', { 'Set-Cookie': [
            'csrftoken=LOGIN_CSRF_TOKEN; Max-Age=31449600; Path=/; secure'
          ]});

      nock('https://leetcode.com')
        .post('/accounts/login/')
        .reply(302, '', {
          'Set-Cookie': [
            'csrftoken=SESSION_CSRF_TOKEN; Max-Age=31449600; Path=/; secure',
            'LEETCODE_SESSION=SESSION_ID; Max-Age=31449600; Path=/; secure'
          ]});

      nock('https://leetcode.com')
        .get('/list/api/questions')
        .reply(200, JSON.stringify({
          user_name: 'Eric',
          favorites: {
            private_favorites: [{id_hash: 'abcdef', name: 'Favorite'}]
          }
        }));

      plugin.login({}, function(e, user) {
        assert.strictEqual(e, null);

        assert.strictEqual(user.loginCSRF, 'LOGIN_CSRF_TOKEN');
        assert.strictEqual(user.sessionCSRF, 'SESSION_CSRF_TOKEN');
        assert.strictEqual(user.sessionId, 'SESSION_ID');
        assert.strictEqual(user.name, 'Eric');
        assert.strictEqual(user.hash, 'abcdef');
        done();
      });
    });

    it('should fail if http error', function(done) {
      nock('https://leetcode.com')
        .get('/accounts/login/')
        .reply(200, '', {
          'Set-Cookie': [
            'csrftoken=LOGIN_CSRF_TOKEN; Max-Age=31449600; Path=/; secure'
          ]});

      nock('https://leetcode.com')
        .post('/accounts/login/')
        .replyWithError('unknown error!');

      plugin.login({}, function(e, user) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });

    it('should fail if http error, 2nd', function(done) {
      nock('https://leetcode.com')
        .get('/accounts/login/')
        .replyWithError('unknown error!');

      plugin.login({}, function(e, user) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });
  }); // #login

  describe('#getProblems', function() {
    it('should ok', function(done) {
      nock('https://leetcode.com')
        .get('/api/problems/algorithms/')
        .replyWithFile(200, './test/mock/problems.json.20160911');

      nock('https://leetcode.com')
        .get('/api/problems/database/')
        .replyWithFile(200, './test/mock/problems.json.20160911');

      nock('https://leetcode.com')
        .get('/api/problems/shell/')
        .replyWithFile(200, './test/mock/problems.json.20160911');

      plugin.getProblems(function(e, problems) {
        assert.strictEqual(e, null);
        assert.strictEqual(problems.length, 377 * 3);
        done();
      });
    });

    it('should fail if error occurs', function(done) {
      nock('https://leetcode.com')
        .get('/api/problems/algorithms/')
        .replyWithFile(200, './test/mock/problems.json.20160911');

      nock('https://leetcode.com')
        .get('/api/problems/database/')
        .replyWithError('unknown error');

      nock('https://leetcode.com')
        .get('/api/problems/shell/')
        .replyWithFile(200, './test/mock/problems.json.20160911');

      plugin.getProblems(function(e, problems) {
        assert.strictEqual(e.message, 'unknown error');
        done();
      });
    });
  }); // #getProblems

  describe('#getCategoryProblems', function() {
    it('should ok', function(done) {
      nock('https://leetcode.com')
        .get('/api/problems/algorithms/')
        .replyWithFile(200, './test/mock/problems.json.20160911');

      plugin.getCategoryProblems('algorithms', function(e, problems) {
        assert.strictEqual(e, null);
        assert.strictEqual(problems.length, 377);
        done();
      });
    });

    it('should fail if not login', function(done) {
      config.autologin.enable = false;
      nock('https://leetcode.com')
        .get('/api/problems/algorithms/')
        .replyWithFile(200, './test/mock/problems.nologin.json.20161015');

      plugin.getCategoryProblems('algorithms', function(e, problems) {
        assert.deepStrictEqual(e, session.errors.EXPIRED);
        done();
      });
    });
  }); // #getCategoryProblems

  describe('#getProblem', function() {
    beforeEach(function() {
      PROBLEM.locked = false;
    });

    it('should ok', function(done) {
      nock('https://leetcode.com')
        .post('/graphql')
        .replyWithFile(200, './test/mock/find-the-difference.json.20171216');

      plugin.getProblem(PROBLEM, function(e, problem) {
        assert.strictEqual(e, null);
        assert.strictEqual(problem.totalAC, '89.7K');
        assert.strictEqual(problem.totalSubmit, '175.7K');
        assert.strictEqual(problem.desc,
          [
            '',
            'Given two strings s and t which consist of only lowercase letters.',
            '',
            'String t is generated by random shuffling string s and then add one more letter at a random position.',
            '',
            'Find the letter that was added in t.',
            '',
            'Example:',
            'Input:',
            's = "abcd"',
            't = "abcde"',
            '',
            'Output:',
            'e',
            '',
            'Explanation:',
            "'e' is the letter that was added.",
            ''
          ].join('\n'));

        assert.strictEqual(problem.templates.length, 12);

        assert.strictEqual(problem.templates[0].value, 'cpp');
        assert.strictEqual(problem.templates[0].text, 'C++');
        assert.strictEqual(problem.templates[0].defaultCode,
          [
            'class Solution {',
            'public:',
            '    char findTheDifference(string s, string t) {',
            '        ',
            '    }',
            '};'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[1].value, 'java');
        assert.strictEqual(problem.templates[1].text, 'Java');
        assert.strictEqual(problem.templates[1].defaultCode,
          [
            'class Solution {',
            '    public char findTheDifference(String s, String t) {',
            '        ',
            '    }',
            '}'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[2].value, 'python');
        assert.strictEqual(problem.templates[2].text, 'Python');
        assert.strictEqual(problem.templates[2].defaultCode,
          [
            'class Solution(object):',
            '    def findTheDifference(self, s, t):',
            '        """',
            '        :type s: str',
            '        :type t: str',
            '        :rtype: str',
            '        """',
            '        '
          ].join('\r\n'));

        assert.strictEqual(problem.templates[3].value, 'python3');
        assert.strictEqual(problem.templates[3].text, 'Python3');
        assert.strictEqual(problem.templates[3].defaultCode,
          [
            'class Solution:',
            '    def findTheDifference(self, s, t):',
            '        """',
            '        :type s: str',
            '        :type t: str',
            '        :rtype: str',
            '        """',
            '        '
          ].join('\r\n'));

        assert.strictEqual(problem.templates[4].value, 'c');
        assert.strictEqual(problem.templates[4].text, 'C');
        assert.strictEqual(problem.templates[4].defaultCode,
          [
            'char findTheDifference(char* s, char* t) {',
            '    ',
            '}'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[5].value, 'csharp');
        assert.strictEqual(problem.templates[5].text, 'C#');
        assert.strictEqual(problem.templates[5].defaultCode,
          [
            'public class Solution {',
            '    public char FindTheDifference(string s, string t) {',
            '        ',
            '    }',
            '}'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[6].value, 'javascript');
        assert.strictEqual(problem.templates[6].text, 'JavaScript');
        assert.strictEqual(problem.templates[6].defaultCode,
          [
            '/**',
            ' * @param {string} s',
            ' * @param {string} t',
            ' * @return {character}',
            ' */',
            'var findTheDifference = function(s, t) {',
            '    ',
            '};'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[7].value, 'ruby');
        assert.strictEqual(problem.templates[7].text, 'Ruby');
        assert.strictEqual(problem.templates[7].defaultCode,
          [
            '# @param {String} s',
            '# @param {String} t',
            '# @return {Character}',
            'def find_the_difference(s, t)',
            '    ',
            'end'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[8].value, 'swift');
        assert.strictEqual(problem.templates[8].text, 'Swift');
        assert.strictEqual(problem.templates[8].defaultCode,
          [
            'class Solution {',
            '    func findTheDifference(_ s: String, _ t: String) -> Character {',
            '        ',
            '    }',
            '}'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[9].value, 'golang');
        assert.strictEqual(problem.templates[9].text, 'Go');
        assert.strictEqual(problem.templates[9].defaultCode,
          [
            'func findTheDifference(s string, t string) byte {',
            '    ',
            '}'
          ].join('\r\n'));

        assert.strictEqual(problem.templates[10].value, 'scala');
        assert.strictEqual(problem.templates[10].text, 'Scala');
        assert.strictEqual(problem.templates[10].defaultCode,
          [
            'object Solution {',
            '    def findTheDifference(s: String, t: String): Char = {',
            '        ',
            '    }',
            '}'
          ].join('\n'));

        assert.strictEqual(problem.templates[11].value, 'kotlin');
        assert.strictEqual(problem.templates[11].text, 'Kotlin');
        assert.strictEqual(problem.templates[11].defaultCode,
          [
            'class Solution {',
            '    fun findTheDifference(s: String, t: String): Char {',
            '        ',
            '    }',
            '}'
          ].join('\n'));

        done();
      });
    });

    it('should fail if no permission for locked', function(done) {
      PROBLEM.locked = true;

      plugin.getProblem(PROBLEM, function(e, problem) {
        assert.strictEqual(e, 'failed to load locked problem!');
        done();
      });
    });

    it('should fail if session expired', function(done) {
      nock('https://leetcode.com').post('/graphql').reply(403);

      plugin.getProblem(PROBLEM, function(e, problem) {
        assert.strictEqual(e, session.errors.EXPIRED);
        done();
      });
    });

    it('should fail if http error', function(done) {
      nock('https://leetcode.com').post('/graphql').reply(500);

      plugin.getProblem(PROBLEM, function(e, problem) {
        assert.deepStrictEqual(e, {msg: 'http error', statusCode: 500});
        done();
      });
    });

    it('should fail if unknown error', function(done) {
      nock('https://leetcode.com').post('/graphql').replyWithError('unknown error!');

      plugin.getProblem(PROBLEM, function(e, problem) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });
  }); // #getProblem

  describe('#testProblem', function() {
    it('should ok', function(done) {
      nock('https://leetcode.com')
        .post('/problems/find-the-difference/interpret_solution/')
        .reply(200, '{"interpret_expected_id": "id1", "interpret_id": "id2"}');

      nock('https://leetcode.com')
        .get('/submissions/detail/id1/check/')
        .reply(200, '{"state": "SUCCESS", "run_success": true, "status_code": 10}');

      nock('https://leetcode.com')
        .get('/submissions/detail/id2/check/')
        .reply(200, '{"state": "SUCCESS", "run_success": false, "status_code": 15}');

      plugin.testProblem(PROBLEM, function(e, results) {
        assert.strictEqual(e, null);
        assert.strictEqual(results[0].id, 'id2');
        assert.strictEqual(results[0].ok, false);
        assert.strictEqual(results[1].id, 'id1');
        assert.strictEqual(results[1].ok, true);
        done();
      });
    });

    it('should fail if http error', function(done) {
      nock('https://leetcode.com')
        .post('/problems/find-the-difference/interpret_solution/')
        .replyWithError('unknown error!');

      plugin.testProblem(PROBLEM, function(e, results) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });
  }); // #testProblem

  describe('#submitProblem', function() {
    it('should ok', function(done) {
      nock('https://leetcode.com')
        .post('/problems/find-the-difference/submit/')
        .reply(200, '{"submission_id": "id1"}');

      nock('https://leetcode.com')
        .get('/submissions/detail/id1/check/')
        .reply(200, '{"state": "SUCCESS", "run_success": true, "status_code": 10}');

      plugin.submitProblem(PROBLEM, function(e, results) {
        assert.strictEqual(e, null);
        assert.strictEqual(results[0].id, 'id1');
        assert.strictEqual(results[0].ok, true);
        done();
      });
    });

    it('should ok after delay', function(done) {
      nock('https://leetcode.com')
        .post('/problems/find-the-difference/submit/')
        .reply(200, '{"error": "You run code too soon"}');
      nock('https://leetcode.com')
        .post('/problems/find-the-difference/submit/')
        .reply(200, '{"submission_id": "id1"}');

      nock('https://leetcode.com')
        .get('/submissions/detail/id1/check/')
        .reply(200, '{"state": "STARTED"}');
      nock('https://leetcode.com')
        .get('/submissions/detail/id1/check/')
        .reply(200, '{"state": "SUCCESS", "run_success": true, "status_code": 10}');

      plugin.submitProblem(PROBLEM, function(e, results) {
        assert.strictEqual(e, null);
        assert.strictEqual(results[0].id, 'id1');
        assert.strictEqual(results[0].ok, true);
        done();
      });
    }).timeout(5000);

    it('should fail if server error', function(done) {
      nock('https://leetcode.com')
        .post('/problems/find-the-difference/submit/')
        .reply(200, '{"error": "maybe internal error?"}');

      plugin.submitProblem(PROBLEM, function(e, results) {
        assert.strictEqual(e, 'maybe internal error?');
        done();
      });
    });

    it('should fail if server error in check result', function(done) {
      nock('https://leetcode.com')
        .post('/problems/find-the-difference/submit/')
        .reply(200, '{"submission_id": "id1"}');

      nock('https://leetcode.com')
        .get('/submissions/detail/id1/check/')
        .replyWithError('unknown error!');

      plugin.submitProblem(PROBLEM, function(e, results) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });
  }); // #submitProblem

  describe('#starProblem', function() {
    it('should star ok', function(done) {
      nock('https://leetcode.com')
        .post('/list/api/questions')
        .reply(204, '');

      plugin.starProblem(PROBLEM, true, function(e, starred) {
        assert.strictEqual(e, null);
        assert.strictEqual(starred, true);
        done();
      });
    });

    it('should unstar ok', function(done) {
      nock('https://leetcode.com')
        .delete('/list/api/questions/abcdef/389')
        .reply(204, '');

      plugin.starProblem(PROBLEM, false, function(e, starred) {
        assert.strictEqual(e, null);
        assert.strictEqual(starred, false);
        done();
      });
    });

    it('should star fail if http error', function(done) {
      nock('https://leetcode.com')
        .post('/list/api/questions')
        .replyWithError('unknown error!');

      plugin.starProblem(PROBLEM, true, function(e, starred) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });
  }); // #starProblem

  describe('#getSubmissions', function() {
    it('should ok', function(done) {
      const problem = {
        id:     1,
        name:   'Two Sum',
        slug:   'two-sum',
        link:   'https://leetcode.com/problems/two-sum',
        locked: false
      };

      nock('https://leetcode.com')
        .get('/api/submissions/two-sum')
        .replyWithFile(200, './test/mock/two-sum.submissions.json.20170425');

      plugin.getSubmissions(problem, function(e, submissions) {
        assert.strictEqual(e, null);
        assert.strictEqual(submissions.length, 20);

        assert.deepStrictEqual(submissions[0], {
          id:             '95464136',
          title:          'Two Sum',
          is_pending:     false,
          lang:           'cpp',
          time:           '1 month, 3 weeks',
          runtime:        '12 ms',
          url:            '/submissions/detail/95464136/',
          status_display: 'Accepted'
        });

        assert.deepStrictEqual(submissions[1], {
          id:             '78502271',
          title:          'Two Sum',
          is_pending:     false,
          lang:           'cpp',
          time:           '6 months, 1 week',
          runtime:        '13 ms',
          url:            '/submissions/detail/78502271/',
          status_display: 'Accepted'
        });
        done();
      });
    });

    it('should fail if http error', function(done) {
      nock('https://leetcode.com')
        .get('/api/submissions/find-the-difference')
        .replyWithError('unknown error!');

      plugin.getSubmissions(PROBLEM, function(e, submissions) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });
  }); // #getSubmissions

  describe('#getSubmission', function() {
    it('should ok', function(done) {
      nock('https://leetcode.com')
        .get('/submissions/detail/73790064/')
        .replyWithFile(200, './test/mock/two-sum.submission.73790064.html.20161006');

      plugin.getSubmission(_.clone(SUBMISSION), function(e, submission) {
        assert.strictEqual(e, null);
        assert.deepStrictEqual(submission.code,
          [
            'class Solution {',
            'public:',
            '    vector<int> twoSum(vector<int>& nums, int target) {',
            '        return res;',
            '    }',
            '};',
            ''
          ].join('\r\n'));
        done();
      });
    });

    it('should fail if http error', function(done) {
      nock('https://leetcode.com')
        .get('/submissions/detail/73790064/')
        .replyWithError('unknown error!');

      plugin.getSubmission(_.clone(SUBMISSION), function(e, submission) {
        assert.strictEqual(e.message, 'unknown error!');
        done();
      });
    });

    it('should fail if no matching submission', function(done) {
      nock('https://leetcode.com')
        .get('/submissions/detail/73790064/')
        .replyWithFile(200, './test/mock/locked.html.20161015');

      plugin.getSubmission(_.clone(SUBMISSION), function(e, submission) {
        assert.strictEqual(e, null);
        assert.strictEqual(submission.code, undefined);
        done();
      });
    });
  }); // #getSubmission

  describe('#getFavorites', function() {
    it('should ok', function(done) {
      nock('https://leetcode.com')
        .get('/list/api/questions')
        .replyWithFile(200, './test/mock/favorites.json.20170716');

      plugin.getFavorites(function(e, favorites) {
        assert.strictEqual(e, null);

        const my = favorites.favorites.private_favorites;
        assert.strictEqual(my.length, 1);
        assert.strictEqual(my[0].name, 'Favorite');
        assert.strictEqual(my[0].id_hash, 'abcdefg');
        done();
      });
    });
  }); // #getFavorites

  describe('#session', function() {
    const DATA = {sessions: []};

    it('should getSessions ok', function(done) {
      nock('https://leetcode.com')
        .post('/session/')
        .reply(200, JSON.stringify(DATA));

      plugin.getSessions(function(e, sessions) {
        assert.ok(!e);
        assert.deepStrictEqual(sessions, []);
        done();
      });
    });

    it('should activateSessions ok', function(done) {
      nock('https://leetcode.com')
        .put('/session/', {func: 'activate', target: 1})
        .reply(200, JSON.stringify(DATA));

      plugin.activateSession({id: 1}, function(e, sessions) {
        assert.ok(!e);
        assert.deepStrictEqual(sessions, []);
        done();
      });
    });

    it('should createSessions ok', function(done) {
      nock('https://leetcode.com')
        .put('/session/', {func: 'create', name: 's1'})
        .reply(200, JSON.stringify(DATA));

      plugin.createSession('s1', function(e, sessions) {
        assert.ok(!e);
        assert.deepStrictEqual(sessions, []);
        done();
      });
    });

    it('should deleteSessions ok', function(done) {
      nock('https://leetcode.com')
        .delete('/session/', {target: 1})
        .reply(200, JSON.stringify(DATA));

      plugin.deleteSession({id: 1}, function(e, sessions) {
        assert.ok(!e);
        assert.deepStrictEqual(sessions, []);
        done();
      });
    });

    it('should fail if 302 returned', function(done) {
      nock('https://leetcode.com')
        .post('/session/')
        .reply(302);

      plugin.getSessions(function(e, sessions) {
        assert.deepStrictEqual(e, session.errors.EXPIRED);
        assert.ok(!sessions);
        done();
      });
    });
  }); // #session
});
