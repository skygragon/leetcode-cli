<img src="https://github.com/skygragon/leetcode-cli/raw/master/docs/logo.png" width="350" align="right">

# leetcode-cli

A cli tool to enjoy leetcode!

Great thanks to leetcode.com, a really awesome website!

[![npm version](https://img.shields.io/npm/v/leetcode-cli.svg?style=flat)](https://www.npmjs.com/package/leetcode-cli)
[![Releases](https://img.shields.io/github/release/skygragon/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/releases)
[![license](https://img.shields.io/npm/l/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/blob/master/LICENSE)
[![Build](https://img.shields.io/travis/skygragon/leetcode-cli.svg?style=flat)](https://travis-ci.org/skygragon/leetcode-cli)
[![Join chat at https://gitter.im/skygragon/leetcode-cli](https://img.shields.io/gitter/room/skygragon/leetcode-cli.svg?style=flat)](https://gitter.im/skygragon/leetcode-cli)

⦙ [Releases](https://skygragon.github.io/leetcode-cli/releases) ⦙
[Install](https://skygragon.github.io/leetcode-cli/install) ⦙
[Docs](https://skygragon.github.io/leetcode-cli/) ⦙
[Commands](https://skygragon.github.io/leetcode-cli/commands) ⦙
[Advanced](https://skygragon.github.io/leetcode-cli/advanced) ⦙
[Plugins](https://github.com/skygragon/leetcode-cli-plugins) ⦙

* A very <kbd>[**EFFICIENT**](#quick-start)</kbd> way to fight problems.
* <kbd>[**CACHING**](https://skygragon.github.io/leetcode-cli/advanced#cache)</kbd> problems locally thus you can easily navigate & think it offline.
* Do everything in <kbd>**CLI**</kbd>, no one even knows you are doing leetcode :p
* <kbd>[**GENERATING**](https://skygragon.github.io/leetcode-cli/commands#show)</kbd> source code template for further coding.
* Support live <kbd>[**TEST**](https://skygragon.github.io/leetcode-cli/commands#test)</kbd> and <kbd>[**SUBMIT**](https://skygragon.github.io/leetcode-cli/commands#submit)</kbd> againts leetcode.com.
* <kbd>[**AUTO LOGIN**](https://skygragon.github.io/leetcode-cli/advanced#auto-login)</kbd> among multiple sessions with single leetcode account.
* Retrieve your previous <kbd>[**SUBMISSION**](https://skygragon.github.io/leetcode-cli/commands#submission)</kbd> thus you can easily backup and manage your code.
* More <kbd>[**PLUGINS**](https://skygragon.github.io/leetcode-cli/advanced#plugins)</kbd> to enjoy extra useful features!

<kbd><img src="https://github.com/skygragon/leetcode-cli/raw/master/docs/screenshots/intro.2018.01.13.gif" /></kbd>

## Quick Start

	Read help first                         $ leetcode help
	Login with your leetcode account        $ leetcode user -l
	Browse all problems                     $ leetcode list
	Choose one problem                      $ leetcode show 1 -g -l cpp
	Coding it!
	Run test(s) and pray...                 $ leetcode test ./two-sum.cpp -t '[3,2,4]\n7'
	Submit final solution!                  $ leetcode submit ./two-sum.cpp
