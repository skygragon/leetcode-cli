'use_strict';
const fs = require('fs');

const h = {
  DIR: './tmp/'
};

h.clean = function() {
  if (!fs.existsSync(this.DIR))
    fs.mkdirSync(this.DIR);
  for (let f of fs.readdirSync(this.DIR)) {
    const fullpath = this.DIR + f;
    if (fs.statSync(fullpath).isDirectory())
      fs.rmdirSync(fullpath);
    else
      fs.unlinkSync(fullpath);
  }
};

module.exports = h;
