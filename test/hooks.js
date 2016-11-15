"use strict";

/*
Hooks
==============
Mocha hooks for each test
*/
const assert = require('chai').assert;
const fs = require('fs-extra');
const config = require('./config/config');

beforeEach( (done) => {
    fs.remove(config.testDir, (err) => {
        assert.isNotOk(err);
        for (let i = 0; i < config.testFiles.length; i++) {
            fs.copySync(__dirname + "/config/test_files/" + config.testFiles[i], config.testDir + "/" + config.testFiles[i]);
        }
        done();
    });
});

afterEach( (done) => {
    fs.remove(config.testDir, (err) => {
        assert.isNotOk(err);
        done();
    });
});