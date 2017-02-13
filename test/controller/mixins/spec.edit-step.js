'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const editStep = require('../../../lib/controller/mixins/edit-step');

describe('mixins/edit-step', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        let options = {
            editSuffix: '/editsuffix',
            editBackStep: 'backstep'
        };

        req = request({
            form: { options },
            baseUrl: '/base/url'
        });
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = editStep(BaseController);
        controller = new StubController(options);

        BaseController.prototype.getNextStep = sinon.stub().returns('/base/nextstep');
        BaseController.prototype.getBackLink = sinon.stub().returns('/base/backlink');
    });

    it('should export a function', () => {
        editStep.should.be.a.function;
        editStep.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('editing', () => {
        it('sets editing flags in req and res', () => {
            controller.editing(req, res, next);
            req.isEditing.should.equal(true);
            res.locals.isEditing.should.equal(true);
            res.locals.editSuffix.should.equal('/editsuffix');
        });

        it('calls the next callback', () => {
            controller.editing(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });

    describe('getBackLink override', () => {
        it('calls the super method', () => {
            controller.getBackLink(req, res);
            BaseController.prototype.getBackLink.should.have.been.calledOnce;
            BaseController.prototype.getBackLink.should.have.been.calledWithExactly(req, res);
        });

        it('returns normal backlink if not editing', () => {
            controller.getBackLink(req, res).should.equal('/base/backlink');
        });

        it('returns previous edit step if it has continueOnEdit option set', () => {
            req.isEditing = true;
            req.journeyModel.set('history', [{ path: '/base/backlink', continueOnEdit: true }]);
            controller.getBackLink(req, res).should.equal('/base/backlink/editsuffix');
        });

        it('returns editBackStep if the previous step does not have continueOnEdit set', () => {
            req.isEditing = true;
            req.journeyModel.set('history', [{ path: '/base/backlink' }]);
            controller.getBackLink(req, res).should.equal('/base/url/backstep');
        });

        it('returns editBackStep if the previous step is not in history', () => {
            req.isEditing = true;
            req.journeyModel.set('history', []);
            controller.getBackLink(req, res).should.equal('/base/url/backstep');
        });
    });

    describe('getNextStep override', () => {
        beforeEach(() => {
            controller.getNextStepObject = sinon.stub().returns({});
        });

        it('calls the super method if not editing', () => {
            controller.getNextStep(req, res);
            BaseController.prototype.getNextStep.should.have.been.calledOnce;
            BaseController.prototype.getNextStep.should.have.been.calledWithExactly(req, res);
        });

        it('does not call the super method if editing', () => {
            req.isEditing = true;
            controller.getNextStep(req, res);
            BaseController.prototype.getNextStep.should.not.have.been.called;
        });

        it('returns editBackStep if the step has no next step', () => {
            req.isEditing = true;
            controller.getNextStep(req, res).should.equal('/base/url/backstep');
        });

        it('returns editBackStep if the step has no continueOnEdit option set', () => {
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'nextstep' });
            controller.getNextStep(req, res).should.equal('/base/url/backstep');
        });

        it('returns next step if the step has the continueOnEdit option set', () => {
            req.isEditing = true;
            controller.options.continueOnEdit = true;
            controller.getNextStepObject.returns({ url: 'nextstep' });
            controller.getNextStep(req, res).should.equal('/base/url/nextstep/editsuffix');
        });

        it('returns next step if the step has the continueOnEdit option set in a matched condition', () => {
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'nextstep', condition: { continueOnEdit: true } });
            controller.getNextStep(req, res).should.equal('/base/url/nextstep/editsuffix');
        });

        it('returns editBackStep if the step has no continueOnEdit option set in a matched condition', () => {
            req.isEditing = true;
            controller.options.continueOnEdit = true;
            controller.getNextStepObject.returns({ url: 'nextstep', condition: {} });
            controller.getNextStep(req, res).should.equal('/base/url/backstep');
        });

    });

});

