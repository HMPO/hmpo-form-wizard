'use strict';

const baseController = require('../../helpers/controller');
const JourneySessionModel = require('../../../lib/journey-model');
const journeyModel = require('../../../lib/controller/mixins/journey-model');

describe('mixins/journey-model', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        let  options = {
            name: 'Wizard-Name',
            journeyName: 'Journey-Name'
        };
        req = request({
            form: { options }
        });
        delete req.journeyModel;
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        StubController = journeyModel(BaseController);
        controller = new StubController(options);
    });

    it('should export a function', () => {
        journeyModel.should.be.a.function;
        journeyModel.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareSetup override', () => {
        it('calls the super method', () => {
            controller.middlewareSetup();
            BaseController.prototype.middlewareSetup.should.have.been.calledOnce;
        });

        it('uses the createJourneyModel middleware', () => {
            controller.middlewareSetup();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.createJourneyModel
            );
        });
    });

    describe('createJourneyModel', () => {
        it('calls next with an error if there is no req.session', () => {
            delete req.session;
            controller.createJourneyModel(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
        });

        it('creates a new journey model on the request and session', () => {
            controller.createJourneyModel(req, res, next);
            req.journeyModel.should.be.an.object;
            req.journeyModel.should.be.an.instanceOf(JourneySessionModel);
            req.session['hmpo-journey-Journey-Name'].should.be.an.object;
        });

        it('destroys an existing journey model before creating a new one', () => {
            let destroy = sinon.stub();
            req.journeyModel = {
                destroy
            };
            controller.createJourneyModel(req, res, next);
            destroy.should.have.been.calledOnce;
        });

        it('resets the journey if the reset option is set and the method is GET', () => {
            controller.options.resetJourney = true;
            req.method = 'GET';
            req.session['hmpo-journey-Journey-Name'] = { existing: true };
            controller.createJourneyModel(req, res, next);
            req.journeyModel.toJSON().should.deep.equal({});
        });

        it('does not reset the journey if the reset option is set and the method is POST', () => {
            controller.options.reset = true;
            req.method = 'POST';
            req.session['hmpo-journey-Journey-Name'] = { existing: true };
            controller.createJourneyModel(req, res, next);
            req.journeyModel.toJSON().should.deep.equal({ existing: true });
        });

        it('calls the next callback', () => {
            controller.createJourneyModel(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });
});

