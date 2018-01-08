'use_strict';
const fs = require('fs');

const h = {
  DIR: './tmp/'
};

h.clean = function() {
  if (!fs.existsSync(this.DIR))
    fs.mkdirSync(this.DIR);
  for (let f of fs.readdirSync(this.DIR))
    fs.unlinkSync(this.DIR + f);
};

module.exports = h;
