var _ = require('underscore');

var h = require('./helper');

var DEFAULT_CONFIG = {
  // usually you don't wanna change those
  URL_BASE:        'https://leetcode.com',
  URL_LOGIN:       'https://leetcode.com/accounts/login/',
  URL_PROBLEMS:    'https://leetcode.com/api/problems/algorithms/',
  URL_PROBLEM:     'https://leetcode.com/problems/$id',
  URL_TEST:        'https://leetcode.com/problems/$key/interpret_solution/',
  URL_SUBMIT:      'https://leetcode.com/problems/$key/submit/',
  URL_SUBMISSIONS: 'https://leetcode.com/api/submissions/$key',
  URL_SUBMISSION:  'https://leetcode.com/submissions/detail/$id/',
  URL_VERIFY:      'https://leetcode.com/submissions/detail/$id/check/',
  URL_STAR:        'https://leetcode.com/problems/favor/',

  // but you will want change these
  LANG:        'cpp', // avail: [c,cpp,csharp,golang,java,javascript,python,ruby,swift]
  USE_COLOR:   true,
  COLOR_THEME: 'default',
  AUTO_LOGIN:  false,
  MAX_WORKERS: 10
};

function Config() {}

Config.prototype.init = function() {
  _.extendOwn(this, DEFAULT_CONFIG);

  // check local config: ~/.lcconfig
  var localConfig = JSON.parse(h.getFileData(h.getConfigFile())) || {};
  _.extendOwn(this, localConfig);
};

module.exports = new Config();
