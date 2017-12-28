---
layout: default
title: Commands Help
---

* [help](#help)
* [cache](#cache)
* [config](#config)
* [list](#list)
* [plugin](#plugin)
* [show](#show)
* [star](#star)
* [stat](#stat)
* [submission](#submission)
* [submit](#submit)
* [test](#test)
* [user](#user)
* [version](#version)

# help

Display help message.

* `leetcode help <command>` to see help on sub command.
* `leetcode <command> --help` also works.

*Examples*

	$ leetcode help

	list [keyword]        list problems
	show <keyword>        show problem by name or index
	star <keyword>        Star problem by name or index
	stat                  show statistics
	submission [keyword]  retrieve earlier submission by name or index
	submit <filename>     submit final solution to leetcode
	test <filename>       send solution to leetcode and run test
	user                  login/logout with leetcode account
	version               show version info

Show help on sub command:

	$ leetcode help list

	leetcode list [keyword]

	Options:
      --help       Show help                                               [boolean]
      --keyword    Filter problems by keyword                               [string]
      --query, -q  Filter problems by conditions:
                   e(easy),m(medium),h(hard),d(done),l(locked)
                   Uppercase means negative, e.g. D(not done)               [string]
      --stat, -s   Show problems statistics                                [boolean]

# cache

Show cached problems.

* `leetcode cache <id>` to show specific problem cache.
* `-d <id>` to delete specific problem cache.
* `-d` to delete all cached problems.

*Examples*

Show cache:

	$ leetcode cache
	.user                                               816.00B    2 hours ago
	problems                                            148.48K    2 hours ago
	1.two-sum.algorithms                                  2.52K    2 hours ago
	......

Delete cache for problem 537:

	$ leetcode cache -d 537

# config

Manage user config (~/.lcconfig).

* `leetcode config` to show all user modified configs.
* `-a` to show all user configs (includes default ones).
* `leetcode config <key>` to show config item by key.
* `leetcode config <key> <value>` to update config by key.
* `-d` to delete config item by key.

*Examples*

Set config item:

	$ leetcode config color:enable false

**NOTE: the key is using colon ":" as the separator, not dot "."!**

Show config item:

	$ leetcode config color
	{
		"enable": true
	}

# list

Navigate the problems.

* Symbols
	* `✔` means you have AC-ed the problem.
	* `✘` means not AC-ed.
	* `★` means starred problem.
	* `🔒` means locked problem.
* `-q` to query by conditions.
	* `e` = easy, `E` = not easy = m + h.
	* `m` = medium, `M` = not medium = e + h.
	* `h` = hard, `H` = not hard = e + m.
	* `d` = done = AC-ed, `D` = not AC-ed.
	* `l` = locked, `L` = not locked.
	* `s` = starred, `S` = unstarred.
* `-t` to filter by given tag.
	* algorithms
	* database
	* shell
* `-s` to show statistic counters.
* `-e` to open editor with generated source file.
* `leetcode list <keyword>` to search by keyword matching.

*Examples*

Show statistcis:

	$ leetcode list -s
	      [385] Mini Parser                                                  Medium (26.5%)
	    ✘ [384] Shuffle an Array                                             Medium (45.7%)
	    ✔ [383] Ransom Note                                                  Easy   (44.5%)
	    ✔ [382] Linked List Random Node                                      Medium (46.6%)
	    ......
	    ✔ [  4] Median of Two Sorted Arrays                                  Hard   (19.6%)
	    ✔ [  3] Longest Substring Without Repeating Characters               Medium (22.9%)
	★   ✔ [  2] Add Two Numbers                                              Medium (25.37 %)
	★   ✔ [  1] Two Sum                                                      Easy   (27.61 %)

	    All:    400       Listed:  400
	    Locked: 73        Starred: 3
	    Accept: 196       Not-AC:  15        New:  189
	    Easy:   106       Medium:  207       Hard: 87

Use keyword search and query:

	$ leetcode list -q Dml array

	  🔒 [360] Sort Transformed Array                                       Medium (41.0%)
	  🔒 [325] Maximum Size Subarray Sum Equals k                           Medium (40.9%)

# plugin

Display installed plugins. To install 3rd party plugins, please check the [Advanced Tips](https://skygragon.github.io/leetcode-cli/advanced#plugins).

* `-i` to install new plugin.
* `-d` to disable existing plugin.
* `-e` to enable existing plugin.
* `-D` to delete existing plugin.

*Example*

Install plugin from github:

	$ leetcode plugin -i company

Install plugin from local file:

	$ leetcode plugin -i <path/of/local/file>/company.js

List all the plugins, `✘` means the plugin is disabled.

	$ leetcode plugin
	✔ retry                default         Plugin to retry last failed request if autologin is on.
	✔ cache                default         Plugin to provide local cache.
	✔ leetcode             default         Plugin to talk with leetcode APIs.

# show

Display problem details. With `-g`/`-l`/`-x`, the code template could be auto generated for you.

* `-g` to generate source file.
* `-x` to add problem description in the generated source file.
* `-c` to only show code template.
* `-l` to choose programming language. (Depends on which langs are provided on leetcode)
	* bash
	* c
	* cpp
	* csharp
	* golang
	* java
	* javascript
	* mysql
	* python
	* python3
	* ruby
	* scala
	* swift
* Instead of index number, you can use name to select a problem.
	* `leetcode show 1`
	* `leetcode show "Two Sum"`
	* `leetcode show two-sum`
* If index number/name not provided, a randomly problem will be displayed.
	* `leetcode show`

*Examples*

	$ leetcode show 1 -g -l cpp

    [1] Two Sum    	(File: two-sum.cpp)

    https://leetcode.com/problems/two-sum/

	* algorithms
    * Easy (25.6%)
    * Total Accepted: 274880
    * Total Submissions: 1074257
    * Testcase Example:  '[3,2,4]\n6'

    Given an array of integers, return indices of the two numbers such that they add up to a specific target.

    You may assume that each input would have exactly one solution.

    Example:

    Given nums = [2, 7, 11, 15], target = 9,

    Because nums[0] + nums[1] = 2 + 7 = 9,
    return [0, 1].

    UPDATE (2016/2/13):
    The return format had been changed to zero-based indices. Please read the above updated description carefully.

Only show the code template:

	$ leetcode show -c 1
	class Solution {
	public:
		vector<int> twoSum(vector<int>& nums, int target) {

		}
	};

# star

Mark your favorite problems. The starred problem will be shown with a `★`.

* `-d` to unstar.
* Instead of index number, you can use name to star a problem.
	* `leetcode star "Two Sum"`
	* `leetcode star two-sum`

*Example*

	$ leetcode star 1
	[1] Two Sum ★

	$ leetcode star 1 -d
	[1] Two Sum ☆

# stat

Show your personal statistics of the problems progress.

* `-g` to show the heatmap graph.
* `-t` to show statistics on given tag. E.g.
	* algorithms
	* database
	* shell

*Example*

Show AC-ed progress:

	$ leetcode stat
	 Easy     116/136 (85.29%)	██████████████████████████░░░░
	 Medium   195/280 (69.64%)	█████████████████████░░░░░░░░░
	 Hard      50/103 (48.54%)	███████████████░░░░░░░░░░░░░░░

	Without Locked:
	 Easy     116/121 (95.87%)	█████████████████████████████░
	 Medium   195/220 (88.64%)	███████████████████████████░░░
	 Hard      50/83  (60.24%)	███████████████████░░░░░░░░░░░

Show heatmap graph:

	$ leetcode stat -g
           1       10   11      20   21      30   31      40   41      50
     001   ██████████   ██████████   █████████░   ██████░███   ██████████
     050   ██████████   ██████████   ██████████   ██████████   ██████████
     100   ██████████   ██████████   █████░████   ██████████   ██████████
     150   █████░░░░█   ░█░██████░   ████    █         ░████   █      ███
     200   ██████████   █░█████░█X   ███░██████   ██████████   ██░░░░░░░░
     250   ░░░░░░██░█   ░ ██░░░█░░   ░░░██░░██░   ░░██░░█░░█   ░█░░█░█░██
     300   █░██░██░█░   ░██░██░██░   ░█░X░█░███   ██░██X██░░   █████░█░██
     350   ░█░░░░█░░░   ░░░░█░██░░   ████░░█░░█   █████████X   ░█████████
     400   ██████░░█░   ░██████░░░   ░░█░░         ░ ██░██░░   ██ ░█░██░░
     450   ███░██  █░   ███░░░█░░    ░░█████  ░   ██░░██░░ ░   ░█░███ █░█
     500   █░██░███       █░██X  █   ░░██X█░ ██   ░█░ █░███    ███░░░░░░

       █ Accepted   X Not Accepted   ░ Remaining

# submission

Retrieve your old submissions from leetcode.com and save to local files.

* For AC-ed problem, the last accepted submission will be retrieved, which output in green color.
* For non AC-ed problem, the last non-accepted submission will be retrieved, which output in yellow.
* If the submission file already exists in local, it will skip retrieving and output in white.

Available options:

* `-o` to specify the output folder.
* `-a` to work against all problems.
* `-l` to specify the desired programming language.
* `-x` to add problem details in the output file.
* Or work against specfic problem only.
	* `leetcode submission 1`
	* `leetcode submission two-sum`


*Examples*

	$ leetcode submission -a -o tmp

	[303] Range Sum Query - Immutable          tmp/range-sum-query-immutable.52178990.ac.cpp
	[319] Bulb Switcher                        tmp/bulb-switcher.52257927.ac.cpp
	[313] Super Ugly Number                    tmp/super-ugly-number.52256965.ac.cpp
	......
	[  1] Two Sum                              tmp/two-sum.73790064.ac.cpp

# submit

Submit code to leetcode.com.

*Examples*

	$ leetcode submit ./two-sum.cpp

	  ✔ Accepted
	  ✔ 16/16 cases passed (12 ms)
	  ✔ Your runtime beats 49.89 % of cpp submissions

# test

Customize your testcase and run it against leetcode. If no testcase provided, a default testcase will be used.

* `-t` to provide test case in command line.
	* NOTE: use single quote `'` to surround your test case. (double quote is NOT safe in bash shell due to escaping)
* `-i` to provide test case in interactive mode.
	* on Linux/MacOS, press `Ctrl-D` to finish input.
	* on Windows, press `Ctrl-D` and `Return` to finish input.

*Examples*

	$ leetcode test ./two-sum.cpp -t '[3,2,4]\n7'

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

# user

Login with your leetcode account (username or email).

* `-l` to login
* `-L` to logout.
* `leetcode user` to show current account.

*Examples*

Login:

	$ leetcode user -l
	login: <account>
	pass:
	Successfully login as <account>

# version

Display version information.

* `-v` to show verbose info, e.g. config, cache dir.

*Examples*

Short:

	$ leetcode version
	2.3.0

Verbose:

	$ leetcode version -v
	 _           _                  _
	| |         | |                | |
	| | ___  ___| |_  ___  ___   __| | ___
	| |/ _ \/ _ \ __|/ __|/ _ \ / _` |/ _ \
	| |  __/  __/ |_  (__| (_) | (_| |  __/
	|_|\___|\___|\__|\___|\___/ \__,_|\___|  CLI v2.3.0

	[Environment]
	Node                 v8.1.4
	OS                   darwin 16.5.0
	Cache:               /Users/skygragon/.lc/
	Config:              /Users/skygragon/.lcconfig

	[Configuration]
	autologin            {"enable":false}
	code                 {"editor":"vim","lang":"haha"}
	color                {"enable":false,"theme":"default"}
	icon                 {"theme":""}
	network              {"concurrency":10}

	[Themes]
	Colors               blue,dark,default,orange,pink
	Icons                ascii,default,win7

	[Plugins]
	retry                default
	cache                default
	leetcode             default

