var cheerio = require('cheerio'),
    request = require('request');

var cache = require('./cache'),
    config = require('./config');

var problems = {};

problems.getAll = function(cb) {
  var items = cache.get('all');
  if (items) return cb(null, items);

  // cache miss, retrieve it now
  request(config.PROBLEMS_URL, function(err, resp, body) {
    if (err) return cb(err);
    if (resp.statusCode != 200) return cb('Invalid HTTP response: ' + resp.statusCode);

    var $ = cheerio.load(body);
    items = $('#problemList tbody tr').map(function(){
      var tds = $(this).children();
      return {
        id:      $(tds[1]).text(),
        name:    $(tds[2]).children('a').text(),
        link:    $(tds[2]).children('a').attr('href'),
        percent: $(tds[3]).text(),
        level:   $(tds[6]).text()
      };
    }).get();

    cache.set('all', items);

    return cb(null, items);
  });
};

module.exports = problems;
