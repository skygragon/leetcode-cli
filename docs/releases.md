---
layout: default
title: Release Notes
---

# 2.3.0

* `plugin`
	* only install necessary depedencies on specific platform.
	* add `-c` option to show plugin config.
	* support [cookie.chrome](https://github.com/skygragon/leetcode-cli-plugins/blob/master/docs/cookie.chrome.md) plugin.
	* support [cookie.firefox](https://github.com/skygragon/leetcode-cli-plugins/blob/master/docs/cookie.firefox.md) plugin.
* docker
	* support running leetcode-cli as docker container for new user's tasting.
	* auto build docker image in Docker Hub.
* UI
	* Add spinner message for long time running works.
* Add logo and updte documents.

# 2.2.1

* add commands aliases.
* enhance documents about install error on Ubuntu.
* `config`
	* fix wrong parsing on non-string value.
* `plugin`
	* fix bug when installing new npm modules.
* `show`
	* use traditional `.py` for python3 filename.
* `submission`
	* enhance recursive folder creation.

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
