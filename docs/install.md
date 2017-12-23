---
layout: default
title: Installation
---

# Prerequisites

`node.js` (`npm` included) required, please follow the installation guide:

* [Install from package manager](https://nodejs.org/en/download/package-manager/)
* [Install from directly download](https://nodejs.org/en/download/)

Please install the latest LTS version on the list above.

Then verify the result:

	$ node -v
	$ npm -v

# Installation

Choose one of the following ways to install leetcode-cli:

### From npm

This will install the latest stable version, but not include the latest development version.

    $ npm install -g leetcode-cli

In case Ubuntu failed due to `permission denied`, run following and try again:

	$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
	$ source ~/.bashrc
	$ nvm install --lts

See more details [here](https://docs.npmjs.com/getting-started/fixing-npm-permissions).

### From GitHub

This will install the latest development version on GitHub.

	$ npm install -g skygragon/leetcode-cli

### From local source

Similar with above, while you can introduce your own changes as you wish.

    $ git clone http://github.com/skygragon/leetcode-cli
    $ cd leetcode-cli && ./bin/install

Then verify the result:

	$ leetcode version
