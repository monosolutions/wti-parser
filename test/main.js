"use strict";

/*
Main Test
==============
General app tests
*/

const fs = require('fs-extra');
const assert = require('chai').assert;
const WTI = require('../index');

describe("Main", () => {

    it("Can require module", (done) => {
        assert.isOk(WTI);
        done();
    });
});