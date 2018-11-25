'use strict'

function len(s) {
  let s1 = s.replace(/\u001b\[[^m]*m/g, ''); // remove color controls
  s1 = s1.replace(/[^\x00-\xff]/g, '  '); // fix non-ascii
  return s1.length;
}

function padLeft(s, n, c) {
  let k = Math.max(0, n - len(s));
  return c.repeat(k) + s;
}

function padRight(s, n , c) {
  let k = Math.max(0, n - len(s));
  return s + c.repeat(k);
}

function padCenter(s, n, c) {
  let k = Math.max(0, n - len(s));
  let r = (k - k % 2) / 2, l = k - r;
  return c.repeat(l) + s + c.repeat(r);
}

const tsprintf = function() {
  const args = Array.from(arguments);
  let fmt = args.shift();
  return fmt.replace(/%[^s%]*[s%]/g, function(s) {
    if (s === '%%') return '%';

    let x = '' + args.shift();
    let n = 0;

    s = s.slice(1, s.length-1);
    if (s.length > 0) {
      switch (s[0]) {
        case '-':
          n = parseInt(s.slice(1)) || 0;
          x = padRight(x, n, ' ');
          break;
        case '=':
          n = parseInt(s.slice(1)) || 0;
          x = padCenter(x, n, ' ');
          break;
        case '0':
          n = parseInt(s.slice(1)) || 0;
          x = padLeft(x, n, '0');
          break;
        default:
          n = parseInt(s) || 0;
          x = padLeft(x, n, ' ');
          break;
      }
    }

    return x;
  });
};

module.exports = tsprintf;
