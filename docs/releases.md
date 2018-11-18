---
layout: default
title: Release Notes
---
# 2.5.4
* fixes error in fresh env without .lc existed.
* embed meta in file content instead of file name.
* update dependencies.

# 2.5.3

* fixes "Failed to load locked problem" issue.
* move plugin's data into separate folders:
  * login info
  * problems list
  * problem cache

# 2.5.2

* `show`
    * fixes 400 error
    * support translated content for leetcode-cn

# 2.5.1

* auto install missing plugins after upgrade.
* use 16m colors if possible.
* enhance color output on windows.
* `cache`
	* fix issue that can't delete cache by name.
* `session`
	* fix issue if session name is a number.
* `stat`
	* use level weight in calendar view.

# 2.5.0

* add `session` command to manage coding sessions on leetcode.com.
* add more color themes.
    * molokai
    * solarized
    * solarized.light
* `list`
    * fix id mismatch issue.
* `show`
    * add `-o` option to specify output folder.
    * fix badge output in non-default color themes.
* `stat`
    * calculate on AC-ed questions in calendar graph.
* `test`
    * fix out-of-order output issue.

# 2.4.0

* only supports node's version >= 4.
* Refactor folder structure:
    * now `~/.lc/` would be the only folder used by leetcode-cli.
    * move lcconfig file to `~/.lc/`.
    * move cache files to `~/.lc/cache/`.
* `config`
    * fix string value parsing error.
* `list`
    * show tag/lang badges in `-x` output.
* `show`
    * add `-q` `-t` options to filter random questions.
* `stat`
    * enhance output of `-g` option.
    * enhance output on windows.
    * add `-c` option to display calendar stat of how many AC-ed questions per day.
    * add `--no-lock` option to filter out locked questions.
    * add `-q` `-t` options to filter questions stat.

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
