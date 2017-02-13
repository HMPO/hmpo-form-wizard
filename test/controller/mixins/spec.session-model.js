'use strict';

const baseController = require('../../helpers/controller');
const WizardSessionModel = require('../../../lib/model');
const sessionModel = require('../../../lib/controller/mixins/session-model');

describe('mixins/session-model', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        let options = {
            name: 'Wizard-Name'
        };
        req = request({
            form: { options }
        });
        delete req.sessionModel;
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        StubController = sessionModel(BaseController);
        controller = new StubController(options);
    });

    it('should export a function', () => {
        sessionModel.should.be.a.function;
        sessionModel.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareSetup override', () => {
        it('calls the super method', () => {
            controller.middlewareSetup();
            BaseController.prototype.middlewareSetup.should.have.been.calledOnce;
        });

        it('uses the createSessionModel middleware', () => {
            controller.middlewareSetup();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.createSessionModel
            );
        });
    });

    describe('createSessionModel', () => {
        it('throws an error if there is no req.session', () => {
            delete req.session;
            expect(() => controller.createSessionModel(req, res, next) ).to.throw();
        });

        it('creates a new session model on the request and session', () => {
            controller.createSessionModel(req, res, next);
            req.sessionModel.should.be.an.object;
            req.sessionModel.should.be.an.instanceOf(WizardSessionModel);
            req.session['hmpo-wizard-Wizard-Name'].should.be.an.object;
        });

        it('destroys an existing session model before creating a new one', () => {
            let destroy = sinon.stub();
            req.sessionModel = {
                destroy
            };
            controller.createSessionModel(req, res, next);
            destroy.should.have.been.calledOnce;
        });

        it('resets the session if the reset option is set', () => {
            controller.options.reset = true;
            req.session['hmpo-wizard-Wizard-Name'] = { existing: true };
            controller.createSessionModel(req, res, next);
            req.sessionModel.toJSON().should.deep.equal({});
        });

        it('calls the next callback', () => {
            controller.createSessionModel(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });
});

