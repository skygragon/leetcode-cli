var _ = require('underscore');

var h = require('./helper');

// usually you don't wanna change those
var DEFAULT_SYS_CONFIG = {
  URL_BASE:            'https://leetcode.com',
  URL_LOGIN:           'https://leetcode.com/accounts/login/',
  URL_PROBLEMS:        'https://leetcode.com/api/problems/$category/',
  URL_PROBLEM:         'https://leetcode.com/problems/$slug/description/',
  URL_PROBLEM_DETAIL:  'https://leetcode.com/graphql',
  URL_TEST:            'https://leetcode.com/problems/$slug/interpret_solution/',
  URL_SUBMIT:          'https://leetcode.com/problems/$slug/submit/',
  URL_SUBMISSIONS:     'https://leetcode.com/api/submissions/$slug',
  URL_SUBMISSION:      'https://leetcode.com/submissions/detail/$id/',
  URL_VERIFY:          'https://leetcode.com/submissions/detail/$id/check/',
  URL_FAVORITES:       'https://leetcode.com/list/api/questions',
  URL_FAVORITE_DELETE: 'https://leetcode.com/list/api/questions/$hash/$id',

  LANGS: [
    'bash',
    'c',
    'cpp',
    'csharp',
    'golang',
    'java',
    'javascript',
    'kotlin',
    'mysql',
    'python',
    'python3',
    'ruby',
    'scala',
    'swift'
  ],

  CATEGORIES: [
    'algorithms',
    'database',
    'shell'
  ],

  PLUGINS: {}
};

// but you will want change these
var DEFAULT_USER_CONFIG = {
  AUTO_LOGIN:  false,
  COLOR_THEME: 'default',
  EDITOR:      'vim',
  ICON_THEME:  '',
  LANG:        'cpp',
  MAX_WORKERS: 10,
  USE_COLOR:   true
};

function Config() {}

Config.prototype.init = function() {
  // check local config: ~/.lcconfig
  var localConfig = JSON.parse(h.getFileData(h.getConfigFile())) || {};
  _.extendOwn(this, this.getDefaultConfig());
  _.extendOwn(this, localConfig);
};

Config.prototype.getDefaultConfig = function() {
  var cfg = {};
  _.extendOwn(cfg, DEFAULT_SYS_CONFIG);
  _.extendOwn(cfg, DEFAULT_USER_CONFIG);
  return cfg;
};

Config.prototype.getUserConfig = function() {
  return _.pick(this, function(v, k) {
    return k in DEFAULT_USER_CONFIG;
  });
};

module.exports = new Config();
