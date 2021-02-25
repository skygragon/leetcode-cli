var cp = require('child_process');
var fs = require('fs');

var h = require('../helper');
var log = require('../log');
var Plugin = require('../plugin.js');
var session = require('../session');

// Please note that we DON'T want implement a lightweight judge engine
// here, thus we are NOT going to support all the problems!!!
//
// Only works for those problems could be easily tested.
//
// [Usage]
//
// https://github.com/skygragon/leetcode-cli-plugins/blob/master/docs/cpp.run.md
//
var plugin = new Plugin(100, 'cpp.run', '2017.07.29',
    'Plugin to run cpp code locally for debugging.');

var FILE_SRC = '.tmp.cpp.run.cpp';
var FILE_EXEC = '.tmp.cpp.run.exe';

plugin.testProblem = function(problem, cb) {
  if (!session.argv.local || h.extToLang(problem.file) !== 'cpp')
    return plugin.next.testProblem(problem, cb);

  log.info('\nTesting locally ...\n');

  // generate full cpp source code that runnable
  var meta = problem.templateMeta;

  var code = fs.readFileSync(problem.file).toString();
  var re = code.match(new RegExp(' ' + meta.name + '\\((.+)\\)'));
  if (!re) return cb('failed to generate runnable code!');

  var types = re[1].split(',').map(function(x) {
    var parts = x.trim().split(' ');
    parts.pop(); // skip param name
    return parts.join(' ');
  });

  var values = problem.testcase.split('\n').map(function(x, i) {
    // TODO: handle more special types??
    // array, list, tree, etc
    var t = meta.params[i].type;
    if (t.indexOf('[]') >= 0 || t === 'ListNode' || t === 'TreeNode')
      x = x.replace(/\[/g, '{').replace(/\]/g, '}');
    if (t === 'ListNode') x = 'make_listnode(' + x + ')';
    if (t === 'TreeNode') x = 'make_treenode(' + x + ')';

    return x;
  });

  var data = DATA.replace('$code', code)
    .replace('$method', meta.name)
    .replace('$argDefs', values.map(function(x, i) {
      return '  decay<' + types[i] + '>::type ' + 'p' + i + ' = ' + x + ';';
    }).join('\n'))
    .replace('$args', values.map(function(x, i) {
      return 'p' + i;
    }).join(','));

  fs.writeFileSync(FILE_SRC, data);

  // compile and run
  var cmd = [
    'g++',
    '-std=c++11',
    '-o',
    FILE_EXEC,
    FILE_SRC,
    '&&',
    './' + FILE_EXEC
  ].join(' ');
  cp.exec(cmd, function(e, stdout, stderr) {
    if (e) {
      stderr.split('\n').forEach(function(line) {
        if (line.length > 0) log.error(line);
      });
    } else {
      stdout.split('\n').forEach(function(line) {
        if (line.length > 0) log.info(line);
      });
    }
  });
};

// FIXME: use file template!!
var DATA = `
#include <algorithm>
#include <bitset>
#include <complex>
#include <deque>
#include <exception>
#include <fstream>
#include <functional>
#include <iomanip>
#include <ios>
#include <iosfwd>
#include <iostream>
#include <istream>
#include <iterator>
#include <limits>
#include <list>
#include <locale>
#include <map>
#include <memory>
#include <new>
#include <numeric>
#include <ostream>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <streambuf>
#include <string>
#include <typeinfo>
#include <utility>
#include <valarray>
#include <vector>

#if __cplusplus >= 201103L
#include <array>
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <forward_list>
#include <future>
#include <initializer_list>
#include <mutex>
#include <random>
#include <ratio>
#include <regex>
#include <scoped_allocator>
#include <system_error>
#include <thread>
#include <tuple>
#include <typeindex>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#endif

using namespace std;

/// leetcode defined data types ///
struct ListNode {
  int val;
  ListNode *next;
  ListNode(int x) : val(x), next(NULL) {}
};

struct TreeNode {
  int val;
  TreeNode *left, *right;
  TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};

ListNode* make_listnode(const vector<int> &v) {
  ListNode head(0), *p = &head, *cur;
  for (auto x: v) { cur = new ListNode(x); p->next = cur; p = cur; }
  return head.next;
}

constexpr long long null = numeric_limits<long long>::min();

TreeNode* make_treenode(const vector<long long> &v) {
  vector<TreeNode*> cur, next;
  TreeNode root(0); cur.push_back(&root);
  long long i = 0, n = v.size(), x;
  while (i < n) {
    for (auto p: cur) {
      if ((x = v[i++]) != null) { p->left = new TreeNode(x); next.push_back(p->left); }
      if (i == n || p == &root) continue;
      if ((x = v[i++]) != null) { p->right = new TreeNode(x); next.push_back(p->right); }
    }
    cur.swap(next); next.clear();
  }
  return root.left;
}

template<class T>
ostream& operator<<(ostream &os, const vector<T> &v) {
  os << "[";
  for (int i = 0; i < v.size(); ++i) os << (i > 0 ? "," : "") << v[i];
  os << "]";
  return os;
}

ostream& operator<<(ostream &os, const ListNode *p) {
  vector<int> v;
  while (p) { v.push_back(p->val); p = p->next; }
  return os << v;
}

ostream& operator<<(ostream &os, const TreeNode *t) {
  vector<string> v;
  queue<const TreeNode*> cur, next;
  if (t) cur.push(t);

  while (!cur.empty()) {
    t = cur.front(); cur.pop();
    v.push_back(t ? to_string(t->val) : "null");
    if (t && (t->left || t->right)) {
      next.push(t->left);
      if (t->right || !cur.empty()) next.push(t->right);
    }
    if (cur.empty()) cur.swap(next);
  }
  return os << v;
}

$code
int main() {
  Solution s;
$argDefs
  auto res = s.$method($args);
  cout << res << endl;
  return 0;
}
`;

module.exports = plugin;
