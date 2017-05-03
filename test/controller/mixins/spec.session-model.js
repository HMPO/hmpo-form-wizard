'use strict';

const baseController = require('../../helpers/controller');
const WizardSessionModel = require('../../../lib/wizard-model');
const sessionModel = require('../../../lib/controller/mixins/session-model');
const journeyModel = require('../../../lib/controller/mixins/journey-model');

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
        StubController = journeyModel(BaseController);
        StubController = sessionModel(StubController);
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
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.createSessionModel
            );
        });
    });

    describe('createSessionModel', () => {
        it('calls next with an error if there is no req.session', () => {
            delete req.session;
            controller.createSessionModel(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
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

        it('resets the session if the reset option is set and the method is GET', () => {
            controller.options.reset = true;
            req.method = 'GET';
            req.session['hmpo-wizard-Wizard-Name'] = { existing: true };
            controller.createSessionModel(req, res, next);
            req.sessionModel.toJSON().should.deep.equal({});
        });

        it('does not reset the session if the reset option is set and the method is POST', () => {
            controller.options.reset = true;
            req.method = 'POST';
            req.session['hmpo-wizard-Wizard-Name'] = { existing: true };
            controller.createSessionModel(req, res, next);
            req.sessionModel.toJSON().should.deep.equal({ existing: true });
        });

        it('calls the next callback', () => {
            controller.createSessionModel(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });
});

