# Table of Contents

* [Bash Completion](#bash-completion)
* [Colorful Output](#colorful-output)
* [Debug Output](#debug-output)
* [Configuration](#configuration)
* [Cache](#cache)
* [Auto Login](#auto-login)


## Bash Completion

Copy `.lc-completion.bash` to your home directory, and source it in .bashrc (Linux) or .bash_profile (MacOS).

	$ cp .lc-completion.bash ~
	$ echo "source ~/.lc-completion.bash" >> ~/.bashrc
	$ source ~/.bashrc

	$ lc list --<tab>
	--help     --keyword  --query    --stat

**NOTE: it might become slower in bash with this enabled, personally I would NOT suggest to use it...**

## Colorful Output

* `--color` to enable color.
* `--no-color` to disable it.

Or use configuration setting to avoid typing it repeatedly, see [below](#configuration).

## Debug Output

* `-v` to enable debug output.
* `-vv` to enable trace output.

## Configuration

Create a JSON file named `.lcconfig` in your home directory, e.g.

	$ cat ~/.lcconfig

	{
		"LANG": "java",
		"USE_COLOR": true,
		"AUTO_LOGIN": false
	}

Here are some useful settings:

* `AUTO_LOGIN` to enable auto login feature, see [below](#auto-login)
* `LANG` to set default language in coding.
* `USE_COLOR` to set colorful output or not by default.

## Cache

The local cache folder (`.lc/`) is in your home directory, e.g.

	$ ls -a1 ~/.lc/

	.user.json         # user info
	all.json           # problems list
	two-sum.json       # specific problem info


## Auto login

Leetcode.com is restricting only one session alive in the same time, which means if you login same account otherwhere, the existing login session will be expired immediately. This will greatly harm your experience since you have to re-login again and again among different sessions.

The good news is leetcode-cli will help a lot on this by trying re-login transparently and automatically without interrupting your current work whenever it detects your current session is expired. To enable this feature you could add following in your config then login again:

	"AUTO_LOGIN": true

**NOTE: once enabled, your PASSWORD will be persisted locally for further using, so PLEASE be careful to ONLY enable this on your OWN computer for the sake of security!**
