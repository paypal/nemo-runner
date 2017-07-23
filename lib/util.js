'use strict';

var spawn = require('threads').spawn;
var instance = require('../lib/instance');
var debug = require('debug');
var log = debug('nemo-runner:log');
var error = debug('nemo-runner:error');

module.exports.append = function filenameAppend(conf, str) {
  // handles "mochawesome" and "mocha-jenkins-reporter" so far
  if (!conf.mocha.reporterOptions) {
    error('didnt find reporterOptions');
    return;
  }
  if (conf.mocha.reporterOptions.reportFilename) {
    conf.mocha.reporterOptions.reportFilename = `${conf.mocha.reporterOptions.reportFilename}_${str}`;
  }
  if (conf.mocha.reporterOptions.junit_report_path) {
    conf.mocha.reporterOptions.junit_report_path = conf.mocha.reporterOptions.junit_report_path.replace(/\.xml$/, `_${str}.xml`);
  }
};

module.exports.kickoff = function kickoff() {
  var results = [];
  var complete = 0;
  var iconfig;
  if (this.instances.length === 1) {
    iconfig = this.instances[0];
    log('single kickoff with instance %O', iconfig.tags);
    // TODO: below doesn't impact debuglogs of modules already loaded
    process.env = Object.assign({}, process.env, iconfig.conf.env || {});
    return instance({basedir: this.program.baseDirectory, profile: iconfig.conf || 'default'});
  }
  // parallel use case
  this.instances.forEach(function (iconfig) {
    log('multi kickoff with instance %O', iconfig.tags);
    var thread = spawn(instance, {env: Object.assign({}, process.env, iconfig.conf.env || {})});
    thread
      .send({basedir: this.program.baseDirectory, profile: iconfig.conf})
      // The handlers come here: (none of them is mandatory)
      .on('message', function (summary) {
        log('Thread complete', summary);
        results.push(summary);
        thread.kill();
      })
      .on('error', function (er) {
        error(er);
      })
      .on('exit', function () {
        var totals;
        complete = complete + 1;
        thread.removeAllListeners('message');
        thread.removeAllListeners('error');
        thread.removeAllListeners('exit');
        if (complete === this.instances.length) {
          totals = {label: 'TOTAL', total: 0, pass: 0, fail: 0};
          log('Everything done, shutting down the thread pool.');
          results.forEach(function (result) {
            totals.total = totals.total + result.total;
            totals.pass = totals.pass + result.pass;
            totals.fail = totals.fail + result.fail;
          });
          results.push(totals);
          /* eslint-disable */
          console.log(results);
          /* eslint-enable */
        }
      }.bind(this));
  }.bind(this));
};