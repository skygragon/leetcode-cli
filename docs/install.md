---
layout: default
title: Installation
---

# Prerequisites

`node.js` (`npm` included) required, please follow the installation guide:

* https://nodejs.org/en/download/package-manager/
* https://nodejs.org/en/download/

You might wanna choose the latest stable release on the list.

Then verify the result:

	$ node -v
	$ npm -v

# Installation

Choose one of the following ways to install leetcode-cli:

### From npm

This will install the latest stable release, but not include the latest development version.

    $ npm install -g leetcode-cli

### From GitHub

This will install the latest development version on GitHub.

	$ npm install -g skygragon/leetcode-cli

### From local source

Similar with above, while you can introduce your changes as you like.

    $ git clone http://github.com/skygragon/leetcode-cli
    $ cd leetcode-cli && ./bin/install

Then verify the result:

	$ leetcode version
