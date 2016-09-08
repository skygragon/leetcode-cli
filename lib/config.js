var _ = require('underscore');
var fs = require('fs');

var h = require('./helper');

var defaultConfig = {
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

function initConfig() {
  var config = defaultConfig;

  // check local config: ~/.lcconfig
  var f = h.getHomeDir() + '/.lcconfig';
  if (fs.existsSync(f)) {
    var localConfig = JSON.parse(fs.readFileSync(f));
    _.extend(defaultConfig, localConfig);
  }

  return config;
}

module.exports = initConfig();
