# leetcode-cli

[![npm version](https://img.shields.io/npm/v/leetcode-cli.svg?style=flat)](https://www.npmjs.com/package/leetcode-cli)
[![license](https://img.shields.io/npm/l/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/blob/master/LICENSE)
[![Build](https://img.shields.io/travis/skygragon/leetcode-cli.svg?style=flat)](https://travis-ci.org/skygragon/leetcode-cli)

A cli tool to enjoy leetcode!

Great thanks to leetcode.com, an really awesome website!

## What can it do?

* A very [**EFFICIENT**](#best-practice) way to fight problems.
* **CACHING** problems locally thus you can easily scan & think it offline.
* Do everything in **CLI**, no one even knows you are doing leetcode :p
* Auto [**GENERATING**](#show) source code template for you.
* Support case [**TEST**](#test) and [**SUBMIT**](#submit) to leetcode.com.
* [**AUTO LOGIN**](#auto-login) among multiple sessions with single leetcode account.

## Prerequisites

node.js (npm included), please follow the installation guide below:

* https://nodejs.org/en/download/
* https://nodejs.org/en/download/package-manager/

## Install

From npm repo:

    $ sudo npm install -g leetcode-cli

From source code:

    $ git clone http://github.com/skygragon/leetcode-cli
    $ cd leetcode-cli && npm install && sudo npm install -g .

## Best Practice

	Read help first						$ lc help
	Login with your leetcoe account		$ lc user -l
	Browse all problems					$ lc list
	Select one problem 					$ lc show 1 -g -l cpp
	Coding it!
	Run test(s) and pray				$ lc test ./two-sum.cpp -t '[3,2,4]\n7'
	Submit final solution!				$ lc submit ./two-sum.cpp
