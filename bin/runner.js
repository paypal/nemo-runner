#!/usr/bin/env node
'use strict';


/**
 * Module dependencies.
 */

var program = require('commander');
var path = require('path');
var fs = require('fs');
var resolve = path.resolve;
var exists = fs.existsSync || path.existsSync;
var Mocha = require('mocha');
var join = path.join;
var cwd = process.cwd();

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version)
  .usage('[debug] [options] [files]')
  .option('-A, --async-only', 'force all tests to take a callback (async) or return a promise')
  .option('-c, --colors', 'force enabling of colors')
  .option('-C, --no-colors', 'force disabling of colors')
  .option('-G, --growl', 'enable growl notification support')
  .option('-O, --reporter-options <k=v,k2=v2,...>', 'reporter-specific options')
  .option('-R, --reporter <name>', 'specify the reporter to use', 'spec')
  .option('-S, --sort', 'sort test files')
  .option('-b, --bail', 'bail after first test failure')
  .option('-d, --debug', "enable node's debugger, synonym for node --debug")
  .option('-g, --grep <pattern>', 'only run tests matching <pattern>')
  .option('-f, --fgrep <string>', 'only run tests containing <string>')
  .option('-gc, --expose-gc', 'expose gc extension')
  .option('-i, --invert', 'inverts --grep and --fgrep matches')
  .option('-r, --require <name>', 'require the given module')
  .option('-s, --slow <ms>', '"slow" test threshold in milliseconds [75]')
  .option('-t, --timeout <ms>', 'set test-case timeout in milliseconds [2000]')
  .option('-u, --ui <name>', 'specify user-interface (' + interfaceNames.join('|') + ')', 'bdd')
  .option('-w, --watch', 'watch files for changes');

program._name = 'nemo-runner';