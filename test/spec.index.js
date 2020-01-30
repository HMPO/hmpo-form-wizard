'use strict';

const exported = require('../');

describe('Module', () => {
    it('should export wizard', () => {
        const wizard = require('../lib/wizard');
        exported.should.equal(wizard);
    });

    it('should export injection lib', () => {
        const injection = require('../injection/session-injection');
        exported.SessionInjection.should.equal(injection);
    });
});
