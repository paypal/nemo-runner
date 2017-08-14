'use strict';

module.exports = function instance(input, done) {
  var Nemo = require('nemo');
  var Mocha = require('mocha');
  var debug = require('debug');
  var log = debug('nemo-runner:log');
  var error = debug('nemo-runner:error');
  var mocha;
  var anyTests = false;
  var baseDirectory = input.basedir;
  var profileConf = input.profile.conf;
  var result = {tags: input.profile.tags, total: 0, pass: 0, fail: 0};
  var driverConfig;
  var runner;

  var exitInstance = function (failures, summary) {
    // only attach this listener if we aren't running in parallel
    if (!done && process) {
      process.on('exit', function () {
        // exit with non-zero status if there were failures
        process.exit(failures);
      });
    }
    // attempted to run with no matching suites/tests
    if (!anyTests && done) {
      done(summary);
    }
  };

  var defineSuite = function (config) {
    var nemo;
    var requireFromConfig = profileConf.mocha.require;
    var modulesToRequire = [];

    // if an array was already declared, use it
    if (requireFromConfig && Array.isArray(requireFromConfig)) {
      modulesToRequire = requireFromConfig;

    // else if it was a single module declared, format to array
    } else if (requireFromConfig && typeof requireFromConfig === 'string') {
      modulesToRequire = [requireFromConfig];
    }

    modulesToRequire.forEach(function (module) {
      try {
        require(module);
      } catch (err) {
        throw new Error(err);
      }
    });

    // make a Mocha
    mocha = new Mocha(profileConf.mocha);
    // add files
    profileConf.tests.forEach(function (file) {
      mocha.addFile(file);
    });
    // calculate driver configuration
    driverConfig = profileConf.driver;
    config.set('driver', Object.assign({}, config.get('driver'), driverConfig));

    if (profileConf.parallel === 'file') {
      // if we're running parallel by file, make sure we really need to run()
      mocha.loadFiles();
      const throwawayRunner = new Mocha.Runner(mocha.suite);
      const matchingTests = throwawayRunner.grep(mocha.options.grep).total;
      if (!matchingTests) {
        // don't run the suite, just exit the process
        return exitInstance();
      }
    }

    runner = mocha.run(function (failures) {
      exitInstance(failures, result);
    });
    // runner.on('start', function (Arg) {
    //         // never called. filed https://github.com/mochajs/mocha/issues/2753
    // });
    runner.on('test', function (Test) {
      Test.ctx.nemo = nemo;
    });
    // runner.on('test end', function (Test) {
    //         // not using this currently
    // });
    runner.on('pass', function () {
      result.total = result.total + 1;
      result.pass = result.pass + 1;
    });
    runner.on('fail', function () {
      result.total = result.total + 1;
      result.fail = result.fail + 1;
    });
    // runner.on('hook end', function (Evt) {
    //         // not using this currently
    // });
    runner.on('hook', function (Evt) {
      // console.log('hook', Evt);
      Evt.ctx.nemo = nemo;
      // not using this currently
    });
    runner.on('suite', function (Suite) {
      anyTests = true;
      if (nemo && nemo.driver) {
        return;
      }
      Suite.beforeAll(function checkNemo(_done) {
        Nemo(config).then(function (_nemo) {
          nemo = _nemo;
          _done();
        }).catch(function (err) {
          error(err);
          _done(err);
          if (done) {
            done(result);
          }
        });
      });
      Suite._beforeAll.unshift(Suite._beforeAll.pop());
    });
    runner.on('suite end', function (Evt) {
      // event is called after every suite but called after all suites with Evt.suites of length N
      if (Evt.suites && Evt.suites.length && Evt.suites.length > 0 && nemo && nemo.driver) {
        nemo.driver.quit()
          .then(function () {
            log('Suite is ended. Quit driver and call done');
            if (done) {
              done(result);
            }
          });
      }
    });
  };
  Nemo.Configure(baseDirectory, {}).then(defineSuite)
    .catch(function (err) {
      error(err);
      if (done) {
        done(result);
      }
    });
};
