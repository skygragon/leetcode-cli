'use strict';
var _ = require('underscore');
var nconf = require('nconf');

var file = require('./file');

const DEFAULT_CONFIG = {
  // usually you don't wanna change those
  sys: {
    categories: [
      'algorithms',
      'database',
      'shell'
    ],
    langs: [
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
    urls: {
      base:            'https://leetcode.com',
      graphql:         'https://leetcode.com/graphql',
      login:           'https://leetcode.com/accounts/login/',
      problems:        'https://leetcode.com/api/problems/$category/',
      problem:         'https://leetcode.com/problems/$slug/description/',
      test:            'https://leetcode.com/problems/$slug/interpret_solution/',
      session:         'https://leetcode.com/session/',
      submit:          'https://leetcode.com/problems/$slug/submit/',
      submissions:     'https://leetcode.com/api/submissions/$slug',
      submission:      'https://leetcode.com/submissions/detail/$id/',
      verify:          'https://leetcode.com/submissions/detail/$id/check/',
      favorites:       'https://leetcode.com/list/api/questions',
      favorite_delete: 'https://leetcode.com/list/api/questions/$hash/$id',
      plugin:          'https://github.com/skygragon/leetcode-cli-plugins/raw/master/plugins/$name.js'
    }
  },

  // but you will want change these
  autologin: {
    enable: false,
    retry:  2
  },
  code: {
    editor: 'vim',
    lang:   'cpp'
  },
  color: {
    enable: true,
    theme:  'default'
  },
  icon: {
    theme: ''
  },
  network: {
    concurrency: 10
  },
  plugins: {}
};

function Config() {}

Config.prototype.init = function() {
  nconf.file('local', file.configFile())
    .add('global', {type: 'literal', store: DEFAULT_CONFIG})
    .defaults({});

  const cfg = nconf.get();
  nconf.remove('local');
  nconf.remove('global');

  // HACK: remove old style configs
  for (let x in cfg) {
    if (x === x.toUpperCase()) delete cfg[x];
  }
  delete DEFAULT_CONFIG.type;
  delete cfg.type;

  _.extendOwn(this, cfg);
};

Config.prototype.getAll = function(useronly) {
  const cfg = _.extendOwn({}, this);
  if (useronly) delete cfg.sys;
  return cfg;
};

module.exports = new Config();
