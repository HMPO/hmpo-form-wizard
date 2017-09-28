'use strict';

const baseController = require('../../helpers/controller');
const baseUrl = require('../../../lib/controller/mixins/base-url');

describe('mixins/base-url', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        req = request({
            baseUrl: '/base/url'
        });
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        StubController = baseUrl(BaseController);
        controller = new StubController();
    });

    it('should export a function', () => {
        baseUrl.should.be.a('function');
        baseUrl.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareSetup override', () => {
        it('calls the super method', () => {
            controller.middlewareSetup();
            BaseController.prototype.middlewareSetup.should.have.been.calledOnce;
        });

        it('uses the setBaseUrlLocal middleware', () => {
            controller.middlewareSetup();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.setBaseUrlLocal
            );
        });
    });

    describe('setBaseUrlLocal', () => {
        it('sets the req.baseUrl as a local', () => {
            controller.setBaseUrlLocal(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
            res.locals.baseUrl.should.equal('/base/url');
        });

        it('calls the next callback', () => {
            controller.setBaseUrlLocal(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

    });
});

