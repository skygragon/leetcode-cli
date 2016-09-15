var _ = require('underscore');

var h = require('./helper');

var DEFAULT_CONFIG = {
  // usually you don't wanna change those
  BASE_URL:     'https://leetcode.com',
  LOGIN_URL:    'https://leetcode.com/accounts/login/',
  PROBLEMS_URL: 'https://leetcode.com/api/problems/algorithms/',
  PROBLEM_URL:  'https://leetcode.com/problems/$id',
  TEST_URL:     'https://leetcode.com/problems/$key/interpret_solution/',
  SUBMIT_URL:   'https://leetcode.com/problems/$key/submit/',
  VERIFY_URL:   'https://leetcode.com/submissions/detail/$id/check/',

  // but you will want change these
  LANG:       'cpp', // avail: [c,cpp,csharp,golang,java,javascript,python,ruby,swift]
  USE_COLOR:  true,
  AUTO_LOGIN: false
};

function Config() {}

Config.prototype.init = function() {
  _.extendOwn(this, DEFAULT_CONFIG);

  // check local config: ~/.lcconfig
  var localConfig = JSON.parse(h.getFileData(h.getConfigFile())) || {};
  _.extendOwn(this, localConfig);
};

module.exports = new Config();
