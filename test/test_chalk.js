'use strict';
const assert = require('assert').strict;
const rewire = require('rewire');

// refer to https://en.wikipedia.org/wiki/ANSI_escape_code
describe('chalk', function() {
  let chalk;

  beforeEach(function() {
    chalk = rewire('../lib/chalk');
    chalk.enabled = true;
    chalk.use256 = true;
    chalk.use16m = false;
  });

  it('should ok w/ 256 colors', function() {
    chalk.init();
    chalk.setTheme('default');

    assert.strictEqual(chalk.black(' '),   '\u001b[38;5;16m \u001b[39m');
    assert.strictEqual(chalk.red(' '),     '\u001b[38;5;196m \u001b[39m');
    assert.strictEqual(chalk.green(' '),   '\u001b[38;5;46m \u001b[39m');
    assert.strictEqual(chalk.yellow(' '),  '\u001b[38;5;226m \u001b[39m');
    assert.strictEqual(chalk.blue(' '),    '\u001b[38;5;21m \u001b[39m');
    assert.strictEqual(chalk.magenta(' '), '\u001b[38;5;201m \u001b[39m');
    assert.strictEqual(chalk.cyan(' '),    '\u001b[38;5;51m \u001b[39m');
    assert.strictEqual(chalk.white(' '),   '\u001b[38;5;231m \u001b[39m');

    assert.strictEqual(chalk.bold(' '),          '\u001b[1m \u001b[22m');
    assert.strictEqual(chalk.dim(' '),           '\u001b[2m \u001b[22m');
    assert.strictEqual(chalk.italic(' '),        '\u001b[3m \u001b[23m');
    assert.strictEqual(chalk.inverse(' '),       '\u001b[7m \u001b[27m');
    assert.strictEqual(chalk.strikethrough(' '), '\u001b[9m \u001b[29m');
    assert.strictEqual(chalk.underline(' '),     '\u001b[4m \u001b[24m');
  });

  it('should ok w/ 8 colors', function() {
    chalk.use256 = false;
    chalk.init();
    chalk.setTheme('default');

    assert.strictEqual(chalk.black(' '),   '\u001b[30m \u001b[39m');
    assert.strictEqual(chalk.red(' '),     '\u001b[91m \u001b[39m');
    assert.strictEqual(chalk.green(' '),   '\u001b[92m \u001b[39m');
    assert.strictEqual(chalk.yellow(' '),  '\u001b[93m \u001b[39m');
    assert.strictEqual(chalk.blue(' '),    '\u001b[94m \u001b[39m');
    assert.strictEqual(chalk.magenta(' '), '\u001b[95m \u001b[39m');
    assert.strictEqual(chalk.cyan(' '),    '\u001b[96m \u001b[39m');
    assert.strictEqual(chalk.white(' '),   '\u001b[97m \u001b[39m');
  });

  it('should ok w/o colors', function() {
    chalk.enabled = false;
    chalk.init();
    chalk.setTheme('default');

    assert.strictEqual(chalk.black(' '),   ' ');
    assert.strictEqual(chalk.red(' '),     ' ');
    assert.strictEqual(chalk.green(' '),   ' ');
    assert.strictEqual(chalk.yellow(' '),  ' ');
    assert.strictEqual(chalk.blue(' '),    ' ');
    assert.strictEqual(chalk.magenta(' '), ' ');
    assert.strictEqual(chalk.cyan(' '),    ' ');
    assert.strictEqual(chalk.white(' '),   ' ');
  });

  it('should sprint w/ 256 colors ok', function() {
    chalk.init();
    chalk.setTheme('default');
    assert.strictEqual(chalk.sprint(' ', '#00ff00'), '\u001b[38;5;46m \u001b[39m');
  });

  it('should sprint w/ 8 colors ok', function() {
    chalk.use256 = false;
    chalk.init();
    chalk.setTheme('default');
    assert.strictEqual(chalk.sprint(' ', '#00ff00'), '\u001b[92m \u001b[39m');
  });

  it('should set theme ok', function() {
    chalk.init();
    chalk.setTheme('dark');
    assert.strictEqual(chalk.sprint(' ', '#009900'), chalk.green(' '));
  });

  it('should set unknown theme ok', function() {
    chalk.init();
    chalk.setTheme('unknown');
    assert.strictEqual(chalk.sprint(' ', '#00ff00'), chalk.green(' '));
  });
});
