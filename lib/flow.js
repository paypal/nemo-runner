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
  profiles = profiles || 'base';
  profiles = (profiles instanceof Array) ? profiles : [profiles];
  this.instances = [];
  profiles.forEach(function (profil) {
    var conf;
    var instance;
    var profileObj = this.config.get(`profiles:${profil}`);
    log('flow:profile %s', profil);
    if (!profileObj) {
      error('flow:profile, profile %s is undefined', profil);
      return;
    }
    conf = merge({}, base, profileObj || {});
    instance = {
      tags: {profile: profil},
      conf: conf
    };
    this.instances.push(instance);
  }.bind(this));
  cb(null, this);
};

let grep = function grep(cb) {
  var instances = [];
  var greps = this.program.grep || '';
  greps = (greps instanceof Array) ? greps : [greps];
  log('flow:grep, greps: %s', greps);
  this.instances.forEach(function (instance) {
    greps.forEach(function (gerp) {
      var _instance = merge({}, instance);
      if (gerp !== '') {
        _instance.conf.mocha.grep = (gerp !== '') ? gerp : '';
        _instance.tags.grep = gerp;
        util.append(_instance.conf, filenamify(gerp));
      }
      instances.push(_instance);
    });
  });
  this.instances = instances;
  log('flow:grep, #instances: %d', this.instances.length);
  cb(null, this);
};

let glob = function glob(cb) {
  var instances = [];
  this.instances.forEach(function (instance, index, arr) {
    var testFileGlob = path.resolve(this.program.baseDirectory, instance.conf.tests);
    Glob(testFileGlob, {}, function (err, files) {
      var _instance = merge({}, instance);
      log('flow:glob, #files %d', files.length);
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
};

let pfile = function pfile(cb) {
  var base = this.config.get('profiles:base');
  var instances = [];
  if (base.parallel && base.parallel === 'file') {
    log('flow:pfile, parallel by file');
    this.instances.forEach(function (instance) {
      var files = instance.conf.tests;
      files.forEach(function (file) {
        var _instance;
        var justFile = file.split(this.program.baseDirectory)[1];
        justFile = filenamify(justFile);
        log('flow:pfile, file %s', justFile);
        _instance = merge({}, instance);
        _instance.conf.tests = [file];
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
