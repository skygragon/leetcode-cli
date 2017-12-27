---
layout: default
title: Installation
---

# Prerequisites

Install the latest LTS version of `node.js` (`npm` included):

* [Install from package manager](https://nodejs.org/en/download/package-manager/)
* [Install from directly download](https://nodejs.org/en/download/)

Check before going next:

	$ node -v
	$ npm -v

# Installation

There are different ways to install `leetcode-cli`:

### From npm

This will install the latest STABLE version, but not include the latest DEV version.

    $ npm install -g leetcode-cli
    $ leetcode version

In case Ubuntu failed due to **permission denied**, try following:

	$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
	$ source ~/.bashrc
	$ nvm install --lts

Find more details [here](https://docs.npmjs.com/getting-started/fixing-npm-permissions).

### From GitHub

This will install the latest DEV version from GitHub repo.

	$ npm install -g skygragon/leetcode-cli
	$ leetcode version

### From source

Similar with above, while you can introduce your own changes as you wish.

    $ git clone http://github.com/skygragon/leetcode-cli
    $ cd leetcode-cli && ./bin/install
    $ leetcode version

### From docker

NOTE: This is just a tiny taste to let you feel that leetcode-cli is. Please use other ways above to install leetcode-cli if you like it.

	$ alias leetcode='docker run -it --rm skygragon/leetcode-cli'
	$ leetcode version

To persistent user data, you can mount a folder like this:

	$ alias leetcode='docker run -it --rm -v /Users/skygragon/data:/root skygragon/leetcode-cli'
