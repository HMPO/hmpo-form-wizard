'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');

describe('mixins/resolve-path', () => {
    let BaseController, StubController, controller;

    beforeEach(() => {
        BaseController = baseController();
        StubController = resolvePath(BaseController);
        controller = new StubController();
    });

    it('should export a function', () => {
        resolvePath.should.be.a('function');
        resolvePath.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('resolvePath', () => {

        it('should return the url value if not a string', () => {
            expect(controller.resolvePath(null, null)).to.be.null;
        });

        it('should return an http url as-is', () => {
            controller.resolvePath('/base', 'http://blah').should.equal('http://blah');
        });

        it('should return a secure http url as-is', () => {
            controller.resolvePath('/base', 'https://blah').should.equal('https://blah');
        });

        it('should resolve a relative url path with the base url', () => {
            controller.resolvePath('/base', 'relative/path').should.equal('/base/relative/path');
        });

        it('should resolve an empty url to just the base path', () => {
            controller.resolvePath('/base', '').should.equal('/base');
        });

        it('should resolve an absolute url to the absolute path', () => {
            controller.resolvePath('/base', '/absolute/path').should.equal('/absolute/path');
        });

        it('should force an absolute path to be relative if the flag is set', () => {
            controller.resolvePath('/base', '/absolute/path', true).should.equal('/base/absolute/path');
        });

        it('should resolve a relative url when then force relative flag is set', () => {
            controller.resolvePath('/base', 'relative/path', true).should.equal('/base/relative/path');
        });

        it('should resolve a forced relative slash url to just the base path', () => {
            controller.resolvePath('/base', '/', true).should.equal('/base');
        });

    });
});
