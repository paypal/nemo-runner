var debug = require('debug');
var log = debug('nemo-runner:log');
var filenamify = require('filenamify');
// var error = debug('nemo-runner:error');

module.exports.mochawesome = function mochawesome(instance) {
  log(`reporter:mochawesome: start: %O`, instance.conf.mocha);
  let reportFilename = '';
  for (let tag in instance.tags) {
    if (instance.tags.hasOwnProperty(tag)) {
      reportFilename += `:${tag}:${instance.tags[tag]}:`;
    }
  }
  let reporterOptions = {
    reportDir: instance.conf.reports,
    reportFilename: filenamify(reportFilename)
  };
  instance.conf.mocha.reporterOptions = Object.assign({}, instance.conf.mocha.reporterOptions, reporterOptions);

};

module.exports['mocha-jenkins-reporter'] = function (instance) {
  log(`reporter:mocha-jenkins-reporter: start: %O`, instance.conf.mocha);
  let reportFilename = '';
  for (let tag in instance.tags) {
    if (instance.tags.hasOwnProperty(tag)) {
      reportFilename += `:${tag}:${instance.tags[tag]}:`;
    }
  }
  // conf.mocha.reporterOptions.junit_report_path = conf.mocha.reporterOptions.junit_report_path.replace(/\.xml$/, `_${str}.xml`);

  let reporterOptions = {
    junit_report_path: `${instance.conf.reports}/${filenamify(reportFilename)}.xml`
  };
  instance.conf.mocha.reporterOptions = Object.assign({}, instance.conf.mocha.reporterOptions, reporterOptions);

};