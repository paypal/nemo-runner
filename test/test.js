/*global describe:true, nemo:true, it:true, before:true, after:true*/
'use strict';

describe('@suite1@suite2@suite3@suite4@', function () {
    it('may fail a few times', function () {
        let nemo = this.nemo;
        return nemo.driver.get(nemo.data.baseUrl)
            .then(function () {
                return nemo.driver.sleep(500);
            });
    });
});
