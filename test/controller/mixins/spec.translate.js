'use strict';

const baseController = require('../../helpers/controller');
const translate = require('../../../lib/controller/mixins/translate');

describe('mixins/translate', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        req = request();
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        StubController = translate(BaseController);
        controller = new StubController();
    });

    it('should export a function', () => {
        translate.should.be.a.function;
        translate.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareSetup override', () => {
        it('calls the super method', () => {
            controller.middlewareSetup();
            BaseController.prototype.middlewareSetup.should.have.been.calledOnce;
        });

        it('uses the setTranslateEngine middleware', () => {
            controller.middlewareSetup();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.setTranslateEngine
            );
        });
    });

    describe('setTranslateEngine', () => {
        it('should set req.translate from the controller options', () => {
            let trans = () => {};
            controller.options.translate = trans;
            controller.setTranslateEngine(req, res, next);
            req.translate.should.equal(trans);
        });

        it('should not sets req.translate if the option is not a function', () => {
            req.translate = 'Existing Translate';
            controller.options.translate = null;
            controller.setTranslateEngine(req, res, next);
            req.translate.should.equal('Existing Translate');
        });

        it('should call the next callback', () => {
            controller.setTranslateEngine(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

    });
});

