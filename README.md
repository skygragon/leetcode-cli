[![npm version](https://img.shields.io/npm/v/leetcode-cli.svg?style=flat)](https://www.npmjs.com/package/leetcode-cli)
[![Releases](https://img.shields.io/github/release/skygragon/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/releases)
[![license](https://img.shields.io/npm/l/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/blob/master/LICENSE)
[![Build](https://img.shields.io/travis/skygragon/leetcode-cli.svg?style=flat)](https://travis-ci.org/skygragon/leetcode-cli)
[![Join chat at https://gitter.im/skygragon/leetcode-cli](https://img.shields.io/gitter/room/skygragon/leetcode-cli.svg?style=flat)](https://gitter.im/skygragon/leetcode-cli)

# leetcode-cli

<img src="https://github.com/skygragon/leetcode-cli/raw/master/docs/logo.png" align="right">

A productive cli tool to enjoy leetcode!

Great thanks to leetcode.com, a really awesome website!

⦙ [Releases](https://skygragon.github.io/leetcode-cli/releases) ⦙
[Install](https://skygragon.github.io/leetcode-cli/install) ⦙
[Docs](https://skygragon.github.io/leetcode-cli/) ⦙
[Commands](https://skygragon.github.io/leetcode-cli/commands) ⦙
[Advanced](https://skygragon.github.io/leetcode-cli/advanced) ⦙
[Plugins](https://github.com/skygragon/leetcode-cli-plugins) ⦙

* A very <kbd>[**EFFICIENT**](#quick-start)</kbd> way to fight questions.
* <kbd>[**CACHING**](https://skygragon.github.io/leetcode-cli/advanced#cache)</kbd> questions to ease offline thinking.
* <kbd>[**GENERATING**](https://skygragon.github.io/leetcode-cli/commands#show)</kbd> source code before coding.
* Live <kbd>[**TEST**](https://skygragon.github.io/leetcode-cli/commands#test)</kbd> and <kbd>[**SUBMIT**](https://skygragon.github.io/leetcode-cli/commands#submit)</kbd> with leetcode.com.
* Download your previous <kbd>[**SUBMISSION**](https://skygragon.github.io/leetcode-cli/commands#submission)</kbd>.
* Trace your coding <kbd>[**STATUS**](https://skygragon.github.io/leetcode-cli/commands#stat)</kbd>.
* <kbd>[**AUTO LOGIN**](https://skygragon.github.io/leetcode-cli/advanced#auto-login)</kbd> among multiple agents with single account.
* Multiple <kbd>[**THEMES**](https://skygragon.github.io/leetcode-cli/advanced#color-themes)</kbd> support.
* More <kbd>[**PLUGINS**](https://skygragon.github.io/leetcode-cli/advanced#plugins)</kbd> to enjoy extra features!

## Screenshot

<kbd><img src="https://github.com/skygragon/leetcode-cli/raw/master/docs/screenshots/intro.2018.01.13.gif" /></kbd>

## Quick Start

	Read help first                         $ leetcode help
	Login with your leetcode account        $ leetcode user -l
	Browse all questions                    $ leetcode list
	Choose one question                     $ leetcode show 1 -g -l cpp
	Coding it!
	Run test(s) and pray...                 $ leetcode test ./two-sum.cpp -t '[3,2,4]\n7'
	Submit final solution!                  $ leetcode submit ./two-sum.cpp
