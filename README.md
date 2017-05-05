# leetcode-cli

[![npm version](https://img.shields.io/npm/v/leetcode-cli.svg?style=flat)](https://www.npmjs.com/package/leetcode-cli)
[![Releases](https://img.shields.io/github/release/skygragon/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/releases)
[![license](https://img.shields.io/npm/l/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/blob/master/LICENSE)
[![Build](https://img.shields.io/travis/skygragon/leetcode-cli.svg?style=flat)](https://travis-ci.org/skygragon/leetcode-cli)
[![Join chat at https://gitter.im/skygragon/leetcode-cli](https://img.shields.io/gitter/room/skygragon/leetcode-cli.svg?style=flat)](https://gitter.im/skygragon/leetcode-cli)

A cli tool to enjoy leetcode!

Great thanks to leetcode.com, a really awesome website!

⦙ [Installation Guide](https://skygragon.github.io/leetcode-cli/install) ⦙
[Documentations](https://skygragon.github.io/leetcode-cli/) ⦙
[Commands](https://skygragon.github.io/leetcode-cli/commands) ⦙
[Advanced Tips](https://skygragon.github.io/leetcode-cli/advanced) ⦙

* A very [**EFFICIENT**](#quick-start) way to fight problems.
* [**CACHING**](https://skygragon.github.io/leetcode-cli/advanced#cache) problems locally thus you can easily navigate & think it offline.
* Do everything in **CLI**, no one even knows you are doing leetcode :p
* [**GENERATING**](https://skygragon.github.io/leetcode-cli/commands#show) source code template for further coding.
* Support live [**TEST**](https://skygragon.github.io/leetcode-cli/commands#test) and [**SUBMIT**](https://skygragon.github.io/leetcode-cli/commands#submit) againts leetcode.com.
* [**AUTO LOGIN**](https://skygragon.github.io/leetcode-cli/advanced#auto-login) among multiple sessions with single leetcode account.
* Retrieve your previous [**SUBMISSION**](https://skygragon.github.io/leetcode-cli/commands#submission) thus you can easily backup and manage your code.

## Demo

`help`/`user`/`list`/`show`/`test`

<img src="https://github.com/skygragon/leetcode-cli/blob/master/screenshots/intro.gif" />

`test`/`submit`/`stat`/`submission`

<img src="https://github.com/skygragon/leetcode-cli/blob/master/screenshots/intro2.gif" />

## Quick Start

	Read help first                         $ leetcode help
	Login with your leetcode account        $ leetcode user -l
	Browse all problems                     $ leetcode list
	Choose one problem                      $ leetcode show 1 -g -l cpp
	Coding it!
	Run test(s) and pray...                 $ leetcode test ./two-sum.cpp -t '[3,2,4]\n7'
	Submit final solution!                  $ leetcode submit ./two-sum.cpp
