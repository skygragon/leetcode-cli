---
layout: default
title: Release Notes
---
# 2.2.0

* `config`
	* add new `config` command to manage user configs.
	* try to save user from manually editing config file (~/.lcconfig).
	* start to use new json config format. (NOTE: not compatible with old format!)
* `show`
	* print suppoerted language list.
* add Release Notes page.
* remove several legacy hacks.

# 2.1.1
* `show`
	* add `-e` option to open editor for coding.
	* add `-c` option to display source code only.
	* remove legacy `-t` `-d` options.
	* fix bad alignment in colorful output.
* `list`
	* enhance `-t` option to support multiple tags, e.g. `leetcode list -t google -t array`
	* support latest `company` plugin to filter questions by tags like `array` or `dynamic programming`
* config
	* add `EDITOR` to set default editor.
* fix `--no-color` bug.


# 2.1.0
* `show`
	* fix "unknown language" error due to recent API changes on leetcode.com.
	* add `kotlin` language.
* `cache`
	* remove `-a` option, now `leetcode cache -d` will directly clear all cache.
	* add keyword match, e.g. `leetcode cache 537` will only show the cache for question 537.
* update most libray depedencies.
