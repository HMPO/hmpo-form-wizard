'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const checkProgress = require('../../../lib/controller/mixins/check-progress');
const editStep = require('../../../lib/controller/mixins/edit-step');

describe('mixins/edit-step', () => {

    let BaseController, StubController;
    let options, req, res, next, controller;

    beforeEach(() => {
        options = {
            editSuffix: '/editsuffix',
            editBackStep: 'backstep'
        };

        req = request({
            originalUrl: '/base/url/path/editsuffix?arg=value',
            baseUrl: '/base/url'
        });
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        BaseController = checkProgress(BaseController);
        StubController = editStep(BaseController);
        controller = new StubController(options);

        BaseController.prototype.getNextStep = sinon.stub().returns('/base/nextstep');
        BaseController.prototype.getBackLink = sinon.stub().returns('/base/backlink');
    });

    it('should export a function', () => {
        editStep.should.be.a('function');
        editStep.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('editing', () => {
        it('sets editing flags in req and res', () => {
            options.editable = true;
            controller.editing(req, res, next);
            req.isEditing.should.equal(true);
            res.locals.isEditing.should.equal(true);
            res.locals.editSuffix.should.equal('/editsuffix');
        });

        it('calls the next callback', () => {
            options.editable = true;
            controller.editing(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls redirect to non edit step if not editable', () => {
            controller.editing(req, res, next);
            res.redirect.should.have.been.calledWithExactly('/base/url/path?arg=value');
        });

        it('throws an error if the edit url does not contain the edit suffix', () => {
            req.originalUrl = '/base/url/path';
            expect(() => controller.editing(req, res, next)).to.throw();
        });
    });

    describe('getBackLink override', () => {
        beforeEach(() => {
            req.form = { options };
        });

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

    describe('checkEditing', () => {
        beforeEach(() => {
            sinon.stub(req.journeyModel, 'get').withArgs('history').returns([
                { path: '/base/url/a', next: '/base/url/b', editing: true },
                { path: '/base/url/b', next: '/base/url/c', editing: true },
                { path: '/base/url/c', next: '/base/url/backstep' },
                { path: '/base/url/backstep' }
            ]);
            sinon.stub(req.journeyModel, 'set');
        });

        it('clears editing status if no longer editing', () => {
            controller.checkEditing(req, res, next);
            req.journeyModel.set.should.have.been.calledOnce.and.calledWithExactly('history', sinon.match.array);
            req.journeyModel.get('history').should.eql([
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c', next: '/base/url/backstep' },
                { path: '/base/url/backstep' }
            ]);
        });

        it('does not clear editing status if editing', () => {
            req.isEditing = true;
            controller.checkEditing(req, res, next);
            req.journeyModel.set.should.not.have.been.called;
        });

        it('does not change history if there are no editing steps ', () => {
            req.journeyModel.get.withArgs('history').returns([
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c', next: '/base/url/backstep' },
                { path: '/base/url/backstep' }
            ]);
            controller.checkEditing(req, res, next);
            req.journeyModel.set.should.not.have.been.called;
        });
    });

    describe('getNextStep override', () => {
        beforeEach(() => {
            req.form = { options };
            controller.getNextStepObject = sinon.stub().returns({});
            req.journeyModel.set('history', [
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c', next: '/base/url/backstep' },
                { path: '/base/url/backstep' }
            ]);
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

        it('returns editBackStep if an allowed step', () => {
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'c' });
            controller.getNextStep(req, res).should.equal('/base/url/backstep');
        });

        it('returns next step if the step has the continueOnEdit option set', () => {
            req.isEditing = true;
            controller.options.continueOnEdit = true;
            controller.getNextStepObject.returns({ url: 'c' });
            controller.getNextStep(req, res).should.equal('/base/url/c/editsuffix');
        });

        it('returns next remote url if the step has the continueOnEdit option set', () => {
            req.isEditing = true;
            controller.options.continueOnEdit = true;
            controller.getNextStepObject.returns({ url: 'http://example.com' });
            controller.getNextStep(req, res).should.equal('http://example.com');
        });

        it('returns next step if the step has the continueOnEdit option set in a matched condition', () => {
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'c', condition: { continueOnEdit: true } });
            controller.getNextStep(req, res).should.equal('/base/url/c/editsuffix');
        });

        it('returns editBackStep if the step has no continueOnEdit option set in a matched condition', () => {
            req.isEditing = true;
            controller.options.continueOnEdit = true;
            controller.getNextStepObject.returns({ url: 'c', condition: {} });
            controller.getNextStep(req, res).should.equal('/base/url/backstep');
        });

        it('returns last valid next in history in edit mode with next arg if backstep is not valid', () => {
            req.journeyModel.set('history', [
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c', next: '/base/url/backstep', invalid: true },
                { path: '/base/url/backstep' }
            ]);
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'b', condition: {} });
            controller.getNextStep(req, res).should.equal('/base/url/c/editsuffix?next');
        });

        it('returns last valid next in history in edit mode if backstep is not valid and revalidate is true', () => {
            req.journeyModel.set('history', [
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c', next: '/base/url/backstep', invalid: true, revalidate: true },
                { path: '/base/url/backstep' }
            ]);
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'b', condition: {} });
            controller.getNextStep(req, res).should.equal('/base/url/c/editsuffix');
        });

        it('returns last valid path in history in edit mode if there is no next', () => {
            req.journeyModel.set('history', [
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c' }
            ]);
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'b', condition: {} });
            controller.getNextStep(req, res).should.equal('/base/url/c/editsuffix');
        });

        it('returns last valid next in history if backstep is not allowed', () => {
            req.journeyModel.set('history', [
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c', next: '/base/url/d' },
                { path: '/base/url/backstep' }
            ]);
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'b', condition: {} });
            controller.getNextStep(req, res).should.equal('/base/url/d/editsuffix');
        });

        it('returns last valid remote url in history if backstep is not allowed', () => {
            req.journeyModel.set('history', [
                { path: '/base/url/a', next: '/base/url/b' },
                { path: '/base/url/b', next: '/base/url/c' },
                { path: '/base/url/c', next: 'http://example.com' },
                { path: '/base/url/backstep' }
            ]);
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'b', condition: {} });
            controller.getNextStep(req, res).should.equal('http://example.com');
        });

        it('returns normal next step if there is no history', () => {
            req.journeyModel.set('history', null);
            req.isEditing = true;
            controller.getNextStepObject.returns({ url: 'nextstep', condition: {} });
            controller.getNextStep(req, res);
            BaseController.prototype.getNextStep.should.have.been.calledWithExactly(req, res);
        });
    });

});

