---
layout: default
title: Advanced Topic
---

* [Auto Login](#auto-login)
* [Bash Completion](#bash-completion)
* [Cache](#cache)
* [Configuration](#configuration)
* [Color Theme](#color-theme)
* [Log Level](#log-level)

# Auto login

Leetcode.com is restricting only one session alive in the same time, which means if you login same account otherwhere, the existing login session will be expired immediately. This will greatly harm your experience since you have to re-login again and again among different sessions.

The good news is leetcode-cli will help a lot on this by trying re-login transparently and automatically without interrupting your current work whenever it detects your current session is expired. To enable this feature you could add following in your config then login again:

	"AUTO_LOGIN": true

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

	.user.json         # your account info
	all.json           # problems list
	two-sum.json       # specific problem info

# Configuration

Create a JSON file named `.lcconfig` in your home directory, e.g.

	$ cat ~/.lcconfig

	{
		"LANG": "java",
		"USE_COLOR": true,
		"COLOR_THEME": "default",
		"AUTO_LOGIN": false
	}

Here are some useful settings:

* `AUTO_LOGIN` to enable auto login feature, see [Auto Login](#auto-login).
* `COLOR_THEME` to set color theme used in output, see [Color Theme](#color-theme).
* `LANG` to set your default language used in coding.
* `USE_COLOR` to enable colorful output.

# Color Theme

You can choose to use colorful output or not.

* `--color` to enable color.
* `--no-color` to disable it.

Or use configuration setting to avoid typing it repeatedly, see [USE_COLOR](#configuration).

When color is enabled, you can choose your favor color theme as well, see [COLOR_THEME](#configuration).

Following are available themes:

* `default`
* `dark` for night.
* `pink` for girls.

Of course you can create your own themes if you like, please see `colors` folder in the source code.

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

# Log Level

* `-v` to enable debug output.
* `-vv` to enable trace output.