var assert = require('chai').assert;
var nock = require('nock');

var client = require('../lib/leetcode_client');
var config = require('../lib/config');

describe('leetcode_client', function() {
  describe('#getProblems', function() {
    it('should ok', function(done) {
      nock(config.PROBLEMS_URL)
        .get('/')
        .replyWithFile(200, './test/mock/problems.json');

      client.getProblems(function(e, problems) {
        assert.equal(e, null);
        assert.equal(problems.length, 377);
        done();
      });
    });
  }); // #getProblems
});
