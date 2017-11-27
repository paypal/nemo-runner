/*global describe:true, nemo:true, it:true, before:true, after:true*/
'use strict';

describe('@pay@', function () {
  it('should show a signup form for payment processor', function () {
    let nemo = this.nemo;
    let {baseUrl, signupButton, signupForm} = nemo.data;

    return nemo.driver.get(baseUrl)
      .then(function () {
        nemo.view._find(signupButton).click();
        nemo.view._waitVisible(signupForm);
      })
  });
});

