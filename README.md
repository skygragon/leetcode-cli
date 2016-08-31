# leetcode-cli

[![npm version](https://img.shields.io/npm/v/leetcode-cli.svg?style=flat)](https://www.npmjs.com/package/leetcode-cli)
[![license](https://img.shields.io/npm/l/leetcode-cli.svg?style=flat)](https://github.com/skygragon/leetcode-cli/blob/master/LICENSE)
[![Build](https://img.shields.io/travis/skygragon/leetcode-cli.svg?style=flat)](https://travis-ci.org/skygragon/leetcode-cli)

A cli tool to enjoy leetcode!

Great thanks to leetcode.com, an really awesome website!

## Table of Contents

* [Prerequisites](#prerequisites)
* [Install](#install)
* [Best Practice](#best-practice)
* [Commands](#commands)
	* [help](#help)
	* [list](#list)
	* [show](#show)
	* [submit](#submit)
	* [test](#test)
	* [user](#user)
	* [version](#version)
* [Tips](#tips)
	* [Bash Completion](#bash-completion)
	* [Colorful Output](#colorful-output)
	* [Configuration](#configuration)

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

## Commands

### help

	list [keyword]     list problems
	show <keyword>     show problem by name or index
	submit <filename>  submit final solution to leetcode
	test <filename>    send solution to leetcode and run test
	user               login/logout with leetcode account
	version            show version info

* `lc help <command>` to see help on sub command.
* `lc <command> --help` also works.

### list

Navigate all the problems. The heading `✔` means you have AC-ed the problem.

    $ lc list

      [385] Mini Parser                                                  Medium (26.5%)
    ✘ [384] Shuffle an Array                                             Medium (45.7%)
    ✔ [383] Ransom Note                                                  Easy   (44.5%)
    ✔ [382] Linked List Random Node                                      Medium (46.6%)
    ......
    ✔ [  4] Median of Two Sorted Arrays                                  Hard   (19.6%)
    ✔ [  3] Longest Substring Without Repeating Characters               Medium (22.9%)
    ✔ [  2] Add Two Numbers                                              Medium (24.5%)
    ✔ [  1] Two Sum                                                      Easy   (25.6%)

* `-q` to filter by query conditions.
	* `e` = easy, `E` = m + h.
	* `m` = medium, `M` = e + h.
	* `h` = hard, `H` = e + m.
	* `d` = done = AC-ed, `D` = not AC-ed.
	* `l` = locked, `L` = not locked.
* `-s` to show statistic counters.
* `lc list <keyword>` to search by keyword.

*Example*

	$ lc list -q Dml array
	  🔒 [360] Sort Transformed Array                                       Medium (41.0%)
	  🔒 [325] Maximum Size Subarray Sum Equals k                           Medium (40.9%)

### show

Select a problem to fight. With `-g`+`-l`, the code template could be auto generated for you.

    $ lc show 1 -g -l cpp

    [1] Two Sum    	(File: two-sum.cpp)

    https://leetcode.com/problems/two-sum/

    * Easy (25.6%)
    * Total Accepted: 274880
    * Total Submissions: 1074257

    Given an array of integers, return indices of the two numbers such that they add up to a specific target.

    You may assume that each input would have exactly one solution.

    Example:

    Given nums = [2, 7, 11, 15], target = 9,

    Because nums[0] + nums[1] = 2 + 7 = 9,
    return [0, 1].

    UPDATE (2016/2/13):
    The return format had been changed to zero-based indices. Please read the above updated description carefully.

* `-g` to generate source file.
* `-l` to choose programming language. (Depends on which langs are provided on leetcode)
	* c
	* cpp
	* csharp
	* golang
	* java
	* javascript
	* python
	* ruby
	* swift
* Instead of index number, you can use name to select a problem.
	* `lc show "Two Sum"`
	* `lc show two-sum`

### submit

	$ lc submit ./two-sum.cpp
		✔ Accepted
		✔ 16/16 cases passed (12 ms)

### test

Customize your testcase and run it against leetcode.

	$ lc test ./two-sum.cpp -t '[3,2,4]\n7'

	Input data:
	[3,2,4]
	7

	Your
		✔ runtime: 0 ms
		✘ answer: [1,2]
		✔ output:

	Expected
		✔ runtime: 0 ms
		✔ answer: [0,2]
		✔ output:

* `-t` to provide test case in command line.
* `-i` to provide test case in interactive mode.

### user

Login with your leetcode account (username or email).

	$ lc user -l
	login: <account>
	pass:
	Successfully login as <account>

* `-l` to login
* `-L` to logout.
* `-s` to show user statistics.
* `lc user` to show current account.

*Eaxmple*

	$ lc user -s
	You are now login as skygragon

	Easy      72/95  (75.79%)      	[+++++++++++++++++++++++.......]
	Medium    97/194 (50.00%)      	[+++++++++++++++...............]
	Hard      27/82  (32.93%)      	[++++++++++....................]

### version

	$ lc version
	0.1.1

* `-v` to show verbose info, e.g. config, cache dir.

*Example*

	$ lc version -v
	leetcode-cli 0.1.1

	Cache: /Users/skygragon/.lc/
	Config: /Users/skygragon/.lcconfig

	BASE_URL = https://leetcode.com
	LOGIN_URL = https://leetcode.com/accounts/login/
	PROBLEMS_URL = https://leetcode.com/problems/
	TEST_URL = https://leetcode.com/problems/$key/interpret_solution/
	SUBMIT_URL = https://leetcode.com/problems/$key/submit/
	VERIFY_URL = https://leetcode.com/submissions/detail/$id/check/
	LANG = cpp
	USE_COLOR = true

## Tips

### Bash Completion

Copy `.lc-completion.bash` to your home directory, and source it in .bashrc (Linux) or .bash_profile (MacOS).

	$ cp .lc-completion.bash ~
	$ echo "source ~/.lc-completion.bash" >> ~/.bashrc
	$ source ~/.bashrc

	$ lc list --<tab>
	--help     --keyword  --query    --stat

### Colorful Output

* `--color` to enable color.
* `--no-color` to disable it.

Or use configuration setting, see below.

### Configuration

Create a file named `.lcconfig` in your home directory.

*Example*

	{
		"LANG": "java",
		"USE_COLOR": true
	}
