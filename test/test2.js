/*global describe:true, nemo:true, it:true, before:true, after:true*/
'use strict';

describe('@suite1.2@suite2.2@suite3.2@suite4.2@', function () {
    it('may fail a few times', function () {
        let nemo = this.nemo;
        return nemo.driver.get(nemo.data.baseUrl)
            .then(function () {
                return nemo.driver.sleep(500);
            });
    });
});
