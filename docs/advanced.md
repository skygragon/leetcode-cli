---
layout: default
title: Advanced Topic
---

* [Aliases](#aliases)
* [Auto Login](#auto-login)
* [Bash Completion](#bash-completion)
* [Cache](#cache)
* [Configuration](#configuration)
* [Color Themes](#color-themes)
* [Log Levels](#log-levels)
* [Plugins](#plugins)

# Aliases

The commands in leetcode-cli usually has builtin aliases as below:

|Command   |Aliases                |
|----------|-----------------------|
|config    |conf, cfg, setting     |
|list      |ls                     |
|plugin    |extension, ext         |
|session   |branch                 |
|show      |view, pick             |
|star      |like, favorite         |
|stat      |stats, progress, report|
|submission|pull                   |
|submit    |push, commit           |
|test      |run                    |
|user      |account                |
|version   |info, env              |

# Auto Login

Leetcode.com is restricting only one session alive in the same time, which means if you login same account otherwhere, the existing login session will be expired immediately. This will greatly harm your experience since you have to re-login again and again among different sessions.

The good news is leetcode-cli will help a lot on this by trying re-login transparently and automatically without interrupting your current work whenever it detects your current session is expired. To enable this feature you could add following in your config then login again:

    {
        "autologin": {
            "enable": true
        }
    }

**NOTE: once enabled, your PASSWORD will be persisted locally for further using, so PLEASE be careful to ONLY enable this on your OWN computer for the sake of security!**

# Bash Completion

Copy `.lc-completion.bash` to your home directory, and source it in .bashrc (Linux) or .bash_profile (MacOS).

    $ cp .lc-completion.bash ~
    $ echo "source ~/.lc-completion.bash" >> ~/.bashrc
    $ source ~/.bashrc

    $ leetcode list --<tab>
    --help     --keyword  --query    --stat

**NOTE: it might become slower in bash with this enabled, personally I would NOT suggest to use it...**

# Cache

The local cache folder (`.lc/`) is in your home directory, e.g.

    $ ls -a1 ~/.lc/
    cache                        # folder of cached questions
    config.json                  # user customized config
    user.json                    # user account info

    $ ls -a1 ~/.lc/cache/
    problems.json                # cached questions list
    1.two-sum.algorithms.json    # cached specific question

**NOTE: Normally you don't need dig into the folder to manipulate those files. Use [cache command](https://skygragon.github.io/leetcode-cli/commands#cache) instead.**

# Configuration

The config file is saved in `~/.lc/config.json`, here is a full exmaple (includes default configs):

    $ cat ~/.lc/config.json

    {
        "auto_login": {
            "enable": false
        },
        "code": {
            "editor": "vim",
            "lang": "cpp"
        },
        "color": {
            "enable": true,
            "theme": "default"
        },
        "icon": {
            "theme": ""
        },
        "network": {
            "concurrency": 10
        },
        "plugins": {}
    }

Here are some useful settings:

* `autologin:enable` to enable auto login feature. (see [Auto Login](#auto-login))
* `code:editor` to set editor used to open generated source file.
* `code:lang` to set your default language used in coding.
* `color:enable` to enable colorful output.
* `color:theme` to set color theme used in output. (see [Color Theme](#color-theme))
* `icon:theme` to set icon them used in output.
* `plugins` to config each installed plugins. (see [Plugins](#plugins))

**NOTE: Normally you don't need dig into the folder to manipulate those files. Use [config command](https://skygragon.github.io/leetcode-cli/commands#config) instead.**

*Example*

Config for `github.js` and `cpp.lint.js` plugins:

    {
        "plugins": {
            "github": {
                "repo": "https://github.com/skygragon/test",
                "token": "abcdefghijklmnopqrstuvwxyz"
            },
            "cpp.lint": {
                "bin": "~/bin/cpplibt.py",
                "flags": []
            }
        }
    }

# Color Themes

You can choose to use colorful output or not.

* `--color` to enable color.
* `--no-color` to disable it.

Or use configuration setting to avoid typing it repeatedly. (see [color:enable](#configuration))

When color is enabled, you can choose your favor color theme as well. (see [color:theme](#configuration))

Following are available themes:

* `blue`
* `dark` for night.
* `default`
* `molokai`
* `orange`
* `pink` for girls.
* `solarized`
* `solarized.light`

Of course you can create your own themes if you like, look into `colors` folder in the source code for more tips.

*Example*

    $ cat colors/default.json
    {
        "black":   "#000000",
        "blue":    "#0000ff",
        "cyan":    "#00ffff",
        "green":   "#00ff00",
        "magenta": "#ff00ff",
        "red":     "#ff0000",
        "white":   "#ffffff",
        "yellow":  "#ffff00"
    }

# Log Levels

* `-v` to enable debug output.
* `-vv` to enable trace output.
    * Will print detailed HTTP requests/responses.

# Plugins

You can easily introduce more features by installing other plugins form third parties. Here lists the avaible 3rd party plugins at the moment:

* [leetcode-cli-plugins](https://github.com/skygragon/leetcode-cli-plugins)

Feel free to try out the plugins above. Or you can develope your own plugins to enrich leetcode-cli's functionalities.
