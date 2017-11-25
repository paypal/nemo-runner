var debug = require('debug');
var log = debug('nemo-runner:log');
var filenamify = require('filenamify');

// var error = debug('nemo-runner:error');

module.exports.mochawesome = function mochawesome(instance) {
  log(`reporter:mochawesome: start: %O`, instance.conf.mocha);
  let instanceLabel = '';
  for (let tag in instance.tags) {
    if (instance.tags.hasOwnProperty(tag)) {
      instanceLabel += `:${tag}:${instance.tags[tag]}:`;
    }
  }
  instance.conf.reports = `${instance.conf.reports}/${filenamify(instanceLabel)}`;
  let reporterOptions = {
    reportDir: instance.conf.reports,
    reportFilename: 'nemo-report'
  };
  instance.conf.mocha.reporterOptions = Object.assign({}, instance.conf.mocha.reporterOptions, reporterOptions);
};

module.exports['mocha-jenkins-reporter'] = function (instance) {
  log(`reporter:mocha-jenkins-reporter: start: %O`, instance.conf.mocha);
  let instanceLabel = '';
  for (let tag in instance.tags) {
    if (instance.tags.hasOwnProperty(tag)) {
      instanceLabel += `:${tag}:${instance.tags[tag]}:`;
    }
  }
  instance.conf.reports = filenamify.path(`${instance.conf.reports}/${instanceLabel}`);
  let reporterOptions = {
    junit_report_path: `${instance.conf.reports}/nemo-report.xml`
  };
  instance.conf.mocha.reporterOptions = Object.assign({}, instance.conf.mocha.reporterOptions, reporterOptions);

};