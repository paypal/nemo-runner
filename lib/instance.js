module.exports = function instance() {
    Nemo.Configure(program.baseDirectory, {}).then(function (config) {
        //calculate current configuration
        let base = config.get(`profiles:base`);
        let target = program.profile && config.get(`profiles:${program.profile}`);
        let nemo;
        let profileConf = Object.assign(base, target);
        //make a Mocha
        mocha = new Mocha(profileConf.mocha);
        //add files
        // console.log('testdir', program.baseDirectory, profileConf.files);
        let testDir = path.resolve(program.baseDirectory, profileConf.tests);
        testFiles.forEach(function (file) {
            mocha.addFile(file);
        });
        //calculate driver configuration
        let driverConfig = config.get('driver');
        let profileDriver = Object.assign(driverConfig, profileConf.driver || {});
        config.set('driver', profileDriver);
        var runner = mocha.run(function (failures) {
            process.on('exit', function () {
                process.exit(failures);  // exit with non-zero status if there were failures
            });
        });
        runner.on('test', function (Test) {
            Test.ctx.nemo = nemo;
        });
        runner.on('suite', function (Suite) {
            if (nemo && nemo.driver) {
                return;
            }
            Suite.beforeAll(function checkNemo(done) {
                Nemo.CompleteSetup(config).then(function (_nemo) {
                    nemo = _nemo;
                    done();
                }).catch(done);
            });
            Suite._beforeAll.unshift(Suite._beforeAll.pop());
        });
        runner.on('suite end', function (Evt) {
            //event is called after every suite but called after all suites with Evt.suites of length N
            Evt.suites && Evt.suites.length && Evt.suites.length > 0 && nemo && nemo.driver && nemo.driver.quit();
        });
    })
        .catch(function (err) {
            console.error(err);
        });
}