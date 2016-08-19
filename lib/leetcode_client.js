var cheerio = require('cheerio'),
    request = require('request'),
    _ = require('underscore');

var config = require('./config');

var leetcode_client = {};

leetcode_client.getProblems = function(cb) {
  request(config.PROBLEMS_URL, function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode != 200) return cb('Invalid HTTP response: ' + resp.statusCode);

    var $ = cheerio.load(body);
    var problems = $('#problemList tbody tr').map(function(){
      var tds = $(this).children();
      var problem = {
        id:      $(tds[1]).text(),
        name:    $(tds[2]).children('a').text(),
        link:    $(tds[2]).children('a').attr('href'),
        percent: $(tds[3]).text(),
        level:   $(tds[6]).text()
      };

      // fixup problem attributes
      problem.key = _.last(_.compact(problem.link.split('/')));
      problem.link = config.BASE_URL + problem.link;

      return problem;
    }).get();

    return cb(null, problems);
  });
};

leetcode_client.getProblem = function(problem, cb) {
  request(problem.link, function(e, resp, body){
    if (e) return cb(e);
    if (resp.statusCode != 200) return cb('Invalid HTTP response: ' + resp.statusCode);

    var $ = cheerio.load(body);
    var info = $('div[class="question-info text-info"] ul li strong');

    problem.desc = $('meta[property="og:description"]').attr('content');
    problem.total_ac = $(info[0]).text();
    problem.total_submit = $(info[1]).text();

    return cb(null, problem);
  });
};

module.exports = leetcode_client;
