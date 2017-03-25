'use strict';

module.exports = function instance(input, done) {
    const Nemo = require('nemo');
    const Mocha = require('mocha');
    let mocha;
    let anyTests = false;
    let path = require('path');
    let baseDirectory = input.basedir;
    let profileConf = input.profile;
    Nemo.Configure(baseDirectory, {}).then(function (config) {
        let result = {label: input.profile.profileLabel, total: 0, pass: 0, fail: 0}

        let nemo;
        //make a Mocha
        mocha = new Mocha(profileConf.mocha);
        //add files
        profileConf.tests.forEach(function (file) {
            mocha.addFile(file);
        });
        //calculate driver configuration
        let driverConfig = profileConf.driver;
        config.set('driver', Object.assign({}, config.get('driver'), driverConfig));
        var runner = mocha.run(function (failures) {
            console.log(arguments);
            //only attach this listener if we aren't running in parallel
            !done && process.on('exit', function () {
                process.exit(failures);  // exit with non-zero status if there were failures
            });
            //attempted to run with no matching suites/tests
            !anyTests && done && done(result);
        });
        runner.on('test', function (Test) {
            Test.ctx.nemo = nemo;
        });
        runner.on('suite', function (Suite) {
            anyTests = true;
            if (nemo && nemo.driver) {
                return;
            }
            Suite.beforeAll(function checkNemo(_done) {
                Nemo.CompleteSetup(config).then(function (_nemo) {
                    nemo = _nemo;
                    _done();
                }).catch(function (err) {
                    _done(err);
                    done(err);
                });
            });
            Suite._beforeAll.unshift(Suite._beforeAll.pop());
        });
        runner.on('suite end', function (Evt) {
            //event is called after every suite but called after all suites with Evt.suites of length N
            Evt.suites && Evt.suites.length && Evt.suites.length > 0 && nemo && nemo.driver && nemo.driver.quit().then(function () {
                Evt.suites.forEach(function (suite) {
                    suite.tests.forEach(function (test) {
                        test.state && (function () {
                            result.total += 1;
                            (test.state === 'passed') ? result.pass++ : result.fail++;
                        })();
                    });
                });
                done(result);
            });
        });
    })
        .catch(function (err) {
            console.error(err);
            done(err);
        });
}