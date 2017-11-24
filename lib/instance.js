'use strict';

module.exports = function instance(input, done) {
  var Nemo = require('nemo');
  var Mocha = require('mocha');
  var debug = require('debug');
  var path = require('path');
  var filenamify = require('filenamify');
  var addContext = require('mochawesome/addContext');
  var mkdirp = require('mkdirp');
  var uuidv4 = require('uuid/v4');
  var fs = require('fs');
  var log = debug('nemo-runner:log');
  var error = debug('nemo-runner:error');
  var mocha;
  var anyTests = false;
  var baseDirectory = input.basedir;
  input.profile.tags.uid = uuidv4();
  var profileConf = input.profile.conf;
  var profileData = input.profile.data;
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
    config.set('data', Object.assign({}, profileData || config.get('data')));

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
      nemo.mocha = Test.ctx;
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
      Evt.ctx.nemo = nemo;
      // not using this currently
    });


    runner.on('suite', function (Suite) {
      log('suite event, suite %s, root: %s', Suite.title, Suite.root);
      anyTests = true;
      if (!(nemo && nemo.driver)) {

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
      }
      Suite.afterEach(function capture() {
        if (this.currentTest.gotScreenshot) {
          return Promise.resolve();
        }
        this.currentTest.gotScreenshot = true;
        log(`afterEach: start`);
        return this.nemo.driver.takeScreenshot()
          .then(function (img) {
            let pFunk;
            let p = new Promise((resolve, reject) => {
              pFunk = {resolve, reject};
            });
            var screenshotName = `${filenamify(this.currentTest.title)}.${input.profile.tags.uid}.png`;
            var imagePath = `${profileConf.reports}/${screenshotName}`;
            addContext(this, screenshotName);
            log(`afterEach: got the screenshot, ${imagePath}`);
            mkdirp.sync(path.dirname(imagePath));

            // save screen image
            fs.writeFile(imagePath, img, {
              'encoding': 'base64'
            }, function (err) {
              if (err) {
                pFunk.reject(err);
              } else {
                pFunk.resolve(true);
              }
            });
            return p;
          }.bind(this))
          .catch(function (err) {
            console.log(`afterEach: triggered error block: ${err}`);
          });
      });
      Suite._afterEach.unshift(Suite._afterEach.pop());
    });
    runner.on('suite end', function (Evt) {
      log('suite end called for %s which is root: %s', Evt.title, Evt.root);
      if (Evt.root && nemo && nemo.driver) {
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
