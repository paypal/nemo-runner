/*global describe:true, nemo:true, it:true, before:true, after:true*/
'use strict';

describe('@search@', function () {
  it('should execute a web search', function () {
    let nemo = this.nemo;
    return nemo.driver.get(nemo.data.baseUrl)
      .then(function () {
        nemo.view._find(nemo.data.input).sendKeys('nemo selenium');
        nemo.view._find(nemo.data.button).click();
        nemo.view._waitVisible(nemo.data.result);
      })

  });
});
