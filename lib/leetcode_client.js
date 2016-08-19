var cheerio = require('cheerio'),
    request = require('request'),
    _ = require('underscore');

var config = require('./config');

var leetcode_client = {};

leetcode_client.getProblems = function(cb) {
  request(config.PROBLEMS_URL, function(e, resp, body) {
    if (e) return cb(e);
    if (resp.statusCode != 200) return cb('HTTP failed:' + resp.statusCode);

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
    if (resp.statusCode != 200) return cb('HTTP failed:' + resp.statusCode);

    var $ = cheerio.load(body);
    var info = $('div[class="question-info text-info"] ul li strong');

    problem.desc = $('meta[property="og:description"]').attr('content');
    problem.total_ac = $(info[0]).text();
    problem.total_submit = $(info[1]).text();

    return cb(null, problem);
  });
};

function getCookie(resp, name) {
  var cookies = resp.headers['set-cookie'];
  if (!cookies) return null;
  for (var i=0; i<cookies.length; ++i) {
    var sections = cookies[i].split(';');
    for (var j=0; j<sections.length; ++j) {
      var kv = sections[j].trim().split('=');
      if (kv[0] == name) return kv[1];
    }
  }
}

leetcode_client.login = function(user, cb) {
  request(config.LOGIN_URL, function(e, resp, body){
    if (e) return cb(e);
    if (resp.statusCode != 200) return cb('HTTP failed:' + resp.statusCode);

    user.csrf = getCookie(resp, 'csrftoken');

    var opts = {
      url: config.LOGIN_URL,
      headers: {
        Origin: config.BASE_URL,
        Referer: config.LOGIN_URL,
        Cookie: 'csrftoken='+user.csrf+';'
      },
      form: {
        csrfmiddlewaretoken: user.csrf,
        login: user.login,
        password: user.pass
      }
    };
    request.post(opts, function(e, resp, body){
      if (e) return cb(e);
      if (resp.statusCode != 302) return cb('HTTP failed:' + resp.statusCode);

      user.session_csrf = getCookie(resp, 'csrftoken');
      user.session_id = getCookie(resp, 'PHPSESSID');
      user.name = getCookie(resp, 'messages').match('Successfully signed in as ([^.]*)')[1];

      return cb(null, user);
    });
  });
};

module.exports = leetcode_client;
