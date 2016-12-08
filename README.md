# leetcode-cli

[![npm version](https://img.shields.io/npm/v/leetcode-cli.svg?style=flat)](https://www.npmjs.com/package/leetcode-cli)
[![license](https://img.shields.io/npm/l/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/blob/master/LICENSE)
[![Build](https://img.shields.io/travis/skygragon/leetcode-cli.svg?style=flat)](https://travis-ci.org/skygragon/leetcode-cli)
[![Join chat at https://gitter.im/skygragon/leetcode-cli](https://img.shields.io/gitter/room/skygragon/leetcode-cli.svg?style=flat)](https://gitter.im/skygragon/leetcode-cli)

A cli tool to enjoy leetcode!

Great thanks to leetcode.com, an really awesome website!

## What can it do?

* A very [**EFFICIENT**](#quick-start) way to fight problems.
* [**CACHING**](https://github.com/skygragon/leetcode-cli/blob/master/doc/advanced.md#cache) problems locally thus you can easily navigate & think it offline.
* Do everything in **CLI**, no one even knows you are doing leetcode :p
* [**GENERATING**](https://github.com/skygragon/leetcode-cli/blob/master/doc/commands.md#show) source code template for further coding.
* Support live [**TEST**](https://github.com/skygragon/leetcode-cli/blob/master/doc/commands.md#test) and [**SUBMIT**](https://github.com/skygragon/leetcode-cli/blob/master/doc/commands.md#submit) againts leetcode.com.
* [**AUTO LOGIN**](https://github.com/skygragon/leetcode-cli/blob/master/doc/advanced.md#auto-login) among multiple sessions with single leetcode account.
* Retrieve your previous [**SUBMISSION**](https://github.com/skygragon/leetcode-cli/blob/master/doc/commands.md#submission) thus you can easily backup and manage your code.

## Prerequisites

node.js (npm included) required, please follow the installation guide:

* https://nodejs.org/en/download/
* https://nodejs.org/en/download/package-manager/

## Install

From npm repo:

    $ sudo npm install -g leetcode-cli

From source code:

    $ git clone http://github.com/skygragon/leetcode-cli
    $ cd leetcode-cli && npm install && sudo npm install -g .

## Quick Start

	Read help first                         $ leetcode help
	Login with your leetcode account        $ leetcode user -l
	Browse all problems                     $ leetcode list
	Choose one problem                      $ leetcode show 1 -g -l cpp
	Coding it!
	Run test(s) and pray...                 $ leetcode test ./two-sum.cpp -t '[3,2,4]\n7'
	Submit final solution!                  $ leetcode submit ./two-sum.cpp

## There is More...

* [Commands Tutorial](https://github.com/skygragon/leetcode-cli/blob/master/doc/commands.md)
* [Advanced Tips](https://github.com/skygragon/leetcode-cli/blob/master/doc/advanced.md)
