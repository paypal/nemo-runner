'use strict';

var merge = require('lodash.merge');
var debug = require('debug');
var log = debug('nemo-runner:log');
var error = debug('nemo-runner:error');
var filenamify = require('filenamify');
var util = require('../lib/util');
var Glob = require('glob');
var path = require('path');

let profile = function profile(cb) {
  var base = this.config.get('profiles:base');
  var profiles = this.program.profile;
  profiles = (profiles instanceof Array) ? profiles : [profiles];
  this.instances = [];
  profiles.forEach(function (profile) {
    log('flow:profile %s', profile);
    var profileObj = this.config.get(`profiles:${profile}`);
    var label = `profile: ${profile || 'default'}`;
    var conf = merge({}, base, profileObj || {});
    var instance = {
      tags: {profile: label},
      conf: conf
    }
    this.instances.push(instance);
  }.bind(this));
  cb(null, this);
};

let grep = function grep(cb) {
  var greps = this.program.grep || '';
  log('flow:grep, greps: %s', greps);
  var instances = [];
  this.instances.forEach(function (instance) {
    greps.forEach(function (grep) {
      var _instance = Object.assign({}, instance);
      if (grep !== '') {
        _instance.conf.mocha.grep = (grep !== '') ? grep : '';
        _instance.tags.grep = grep;
        util.append(_instance.conf, filenamify(grep));
      }
      instances.push(_instance);
    });
  });
  this.instances = instances;
  log('flow:grep, #instances: %d', this.instances.length);
  cb(null, this);
};

let glob = function glob(cb) {
  var base = this.config.get('profiles:base');
  var instances = [];
  this.instances.forEach(function (instance, index, arr) {
    var testFileGlob = path.resolve(this.program.baseDirectory, instance.conf.tests);
    Glob(testFileGlob, {}, function (err, files) {
      log('flow:glob, #files %d', files.length);
      var _instance = Object.assign({}, instance);
      if (err) {
        return cb(err);
      }
      _instance.conf.tests = files;
      instances.push(_instance);
      if (index === arr.length - 1) {
        this.instances = instances;
        log('flow:glob, #instances: %d', this.instances.length);
        cb(null, this);
      }
    }.bind(this));
  }.bind(this));

  // cb(null, this);
};

let pfile = function pfile(cb) {
  var base = this.config.get('profiles:base');
  var instances = [];
  if (base.parallel && base.parallel === 'file') {
    log('flow:pfile, parallel by file');
    this.instances.forEach(function (instance, index, arr) {
      var files = instance.conf.tests;
      files.forEach(function (file) {
        var justFile = file.split(this.program.baseDirectory)[1];
        justFile = filenamify(justFile);
        var _instance = Object.assign({}, instance);
        _instance.conf.mocha.tests = [file];
        _instance.tags.file = justFile;
        util.append(_instance.conf, justFile);
        instances.push(_instance);
      }.bind(this));
    }.bind(this));
    this.instances = instances;
  }
  log('flow:pfile, #instances: %d', this.instances.length);
  cb(null, this);
};
module.exports = [profile, grep, glob, pfile];