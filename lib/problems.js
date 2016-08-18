var cheerio = require('cheerio'),
    request = require('request'),
    _ = require('underscore');

var cache = require('./cache'),
    config = require('./config');

var problems = {};

problems.getAll = function(cb) {
  var cached = cache.get('all');
  if (cached) return cb(null, cached);

  // cache miss, retrieve it now
  request(config.PROBLEMS_URL, function(err, resp, body) {
    if (err) return cb(err);
    if (resp.statusCode != 200) return cb('Invalid HTTP response: ' + resp.statusCode);

    var $ = cheerio.load(body);
    var items = $('#problemList tbody tr').map(function(){
      var tds = $(this).children();
      var item = {
        id:      $(tds[1]).text(),
        name:    $(tds[2]).children('a').text(),
        link:    config.BASE_URL + $(tds[2]).children('a').attr('href'),
        percent: $(tds[3]).text(),
        level:   $(tds[6]).text()
      };
      item.key = _.last(_.compact(item.link.split('/')))
      return item;
    }).get();

    cache.set('all', items);
    return cb(null, items);
  });
};

problems.getOne = function(item, cb) {
  var cached = cache.get(item.key);
  if (cached) return cb(null, cached);

  request(item.link, function(err, resp, body){
    if (err) return cb(err);
    if (resp.statusCode != 200) return cb('Invalid HTTP response: ' + resp.statusCode);

    var $ = cheerio.load(body);
    item.desc = $('meta[property="og:description"]').attr('content');
    var info = $('div[class="question-info text-info"] ul li strong');
    item.total_ac = $(info[0]).text();
    item.total_submit = $(info[1]).text();

    cache.set(item.key, item);
    return cb(null, item);
  });
};

problems.searchOne = function(key, cb) {
  var self = this;

  this.getAll(function(err, items){
    if (err) return cb(err);

    var item = _.find(items, function(x){
      return x.id == key || x.name == key || x.key == key;
    });
    return self.getOne(item, cb);
  });
};

module.exports = problems;
