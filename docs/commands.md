---
layout: default
title: Commands Help
---

* [help](#help)
* [list](#list)
* [show](#show)
* [star](#star)
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

	list [keyword]     list problems
	show <keyword>     show problem by name or index
	submit <filename>  submit final solution to leetcode
	test <filename>    send solution to leetcode and run test
	user               login/logout with leetcode account
	version            show version info

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

# list

Navigate all the problems. The heading `✔` means you have AC-ed the problem, `✘` means not AC-ed.

* `-q` to query by conditions.
	* `e` = easy, `E` = m + h.
	* `m` = medium, `M` = e + h.
	* `h` = hard, `H` = e + m.
	* `d` = done = AC-ed, `D` = not AC-ed.
	* `l` = locked, `L` = not locked.
	* `s` = starred, `S` = unstarred.
* `-s` to show statistic counters.
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

# show

Display problem details. With `-g`+`-l`, the code template could be auto generated for you.

* `-g` to generate source file.
* `-x` to add problem details in the generated source file.
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
	* `leetcode show "Two Sum"`
	* `leetcode show two-sum`

*Examples*

	$ leetcode show 1 -g -l cpp

    [1] Two Sum    	(File: two-sum.cpp)

    https://leetcode.com/problems/two-sum/

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

# submission

Retrieve your existing submissions from leetcode.com and save to local files.

* For AC-ed problem, the last accepted submission will be retrieved, which output in green color.
* For non AC-ed problem, the last non-accepted submission will be retrieved, which output in yellow.
* If the submission file already exists in local, it will skip retrieving and output in white.

Available options:

* `-o` to specify the output folder.
* `-a` to work against all problems.
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

# test

Customize your testcase and run it against leetcode. If no testcase provided, a default testcase will be used.

* `-t` to provide test case in command line.
* `-i` to provide test case in interactive mode.

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
* `-s` to show user statistics.
* `leetcode user` to show current account.

*Examples*

Login:

	$ leetcode user -l
	login: <account>
	pass:
	Successfully login as <account>

Show user statistics:

	$ leetcode user -s
	You are now login as <account>

	Easy      72/95  (75.79%)      	[+++++++++++++++++++++++.......]
	Medium    97/194 (50.00%)      	[+++++++++++++++...............]
	Hard      27/82  (32.93%)      	[++++++++++....................]

# version

Display version information.

* `-v` to show verbose info, e.g. config, cache dir.

*Examples*

Short:

	$ leetcode version
	0.8.0

Verbose:

	$ leetcode version -v
	 _           _                  _
	| |         | |                | |
	| | ___  ___| |_  ___  ___   __| | ___
	| |/ _ \/ _ \ __|/ __|/ _ \ / _` |/ _ \
	| |  __/  __/ |_  (__| (_) | (_| |  __/
	|_|\___|\___|\__|\___|\___/ \__,_|\___|  CLI v0.8.0

	[Environment]
	Cache:  /Users/skygragon/.lc/
	Config: /Users/skygragon/.lcconfig

	[Configuration]
	AUTO_LOGIN:      true
	LANG:            java
	MAX_WORKERS:     10
	URL_BASE:        https://leetcode.com
	URL_LOGIN:       https://leetcode.com/accounts/login/
	URL_PROBLEM:     https://leetcode.com/problems/$id
	URL_PROBLEMS:    https://leetcode.com/api/problems/algorithms/
	URL_SUBMISSION:  https://leetcode.com/submissions/detail/$id/
	URL_SUBMISSIONS: https://leetcode.com/problems/$key/submissions/
	URL_SUBMIT:      https://leetcode.com/problems/$key/submit/
	URL_TEST:        https://leetcode.com/problems/$key/interpret_solution/
	URL_VERIFY:      https://leetcode.com/submissions/detail/$id/check/
	USE_COLOR:       true
