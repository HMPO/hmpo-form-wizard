'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const checkProgress = require('../../../lib/controller/mixins/check-progress');

describe('mixins/check-progress', () => {

    let BaseController, StubController;
    let req, res, next, controller, options;

    beforeEach(() => {
        options = {
            fields: {},
            allFields: {},
            checkJourney: true,
            name: 'wizard',
            route: '/teststep',
            fullPath: '/base/teststep',
            template: 'template',
            next: 'nextstep'
        };

        req = request({
            form: { options },
            baseUrl: '/base'
        });
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = checkProgress(BaseController);
        controller = new StubController(options);
    });

    it('should export a function', () => {
        checkProgress.should.be.a('function');
        checkProgress.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareChecks override', () => {
        it('calls the super method', () => {
            controller.middlewareChecks();
            BaseController.prototype.middlewareChecks.should.have.been.calledOnce;
        });

        it('uses the checkJourneyProgress and checkProceedToNextStep middleware', () => {
            controller.middlewareChecks();
            BaseController.prototype.use.should.have.been.calledTwice;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.checkJourneyProgress
            );
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.checkProceedToNextStep
            );
        });
    });

    describe('checkJourneyProgress', () => {
        it('truncates journey history if reset session option is present', () => {
            controller.resetJourneyHistory = sinon.stub();
            controller.options.reset = true;
            controller.checkJourneyProgress(req, res, next);
            controller.resetJourneyHistory.should.have.been.calledWithExactly(req, res);
        });

        it('calls callback with MISSING_PREREQ error if there are no steps in history', () => {
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.args[0][0].should.be.an.instanceOf(Error);
            next.args[0][0].code.should.equal('MISSING_PREREQ');
            expect(next.args[0][0].redirect).to.be.undefined;
        });

        it('calls callback with MISSING_PREREQ error if this step isn\'t a nextstep in history', () => {
            req.journeyModel.set('history', [{
                path: '/previous/step',
                next: '/path/anotherstep'
            }]);
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.args[0][0].should.be.an.instanceOf(Error);
            next.args[0][0].code.should.equal('MISSING_PREREQ');
            next.args[0][0].redirect.should.equal('/path/anotherstep');
        });

        it('calls callback with MISSING_PREREQ error and redirect of last step if it has no next', () => {
            req.journeyModel.set('history', [{
                path: '/previous/step',
                next: null
            }]);
            controller.checkJourneyProgress(req, res, next);
            next.args[0][0].redirect.should.equal('/previous/step');
        });

        it('calls callback with no arguments if step is an entry point', () => {
            controller.options.entryPoint = true;
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with no arguments if journey checking is disabled', () => {
            controller.options.checkJourney = false;
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with no arguments if this step is a next step', () => {
            req.journeyModel.set('history', [{
                path: '/previous/step',
                next: '/base/teststep'
            }]);
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with MISSING_PREREQ if previous step is invalid', () => {
            req.journeyModel.set('history', [
                {
                    path: '/first/step',
                    next: '/previous/step'
                },
                {
                    path: '/previous/step',
                    next: '/base/teststep',
                    invalid: true
                }
            ]);
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.args[0][0].should.be.an.instanceOf(Error);
            next.args[0][0].code.should.equal('MISSING_PREREQ');
            next.args[0][0].redirect.should.equal('/previous/step?next');
        });

        it('calls callback with MISSING_PREREQ if previous step is invalid and revalidate is true', () => {
            req.journeyModel.set('history', [
                {
                    path: '/first/step',
                    next: '/previous/step'
                },
                {
                    path: '/previous/step',
                    next: '/base/teststep',
                    invalid: true,
                    revalidate: true
                }
            ]);
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.args[0][0].should.be.an.instanceOf(Error);
            next.args[0][0].code.should.equal('MISSING_PREREQ');
            next.args[0][0].redirect.should.equal('/previous/step');
        });

        it('calls callback with no arguments if a prereq is in the history', () => {
            controller.options.prereqs = [ '/allowed/step', '/previous/step' ];
            req.journeyModel.set('history', [{
                path: '/previous/step',
                next: '/base/anotherstep'
            }]);
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with no arguments if a relative prereq is in the history', () => {
            controller.options.prereqs = [ '/allowed/step', 'previous' ];
            req.journeyModel.set('history', [{
                path: '/base/previous',
                next: '/base/anotherstep'
            }]);
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });

    describe('checkProceedToNextStep', () => {
        beforeEach(() => {
            controller.successHandler = sinon.stub();
            req.query = { next: '' };
            req.journeyModel.set('history', [
                {
                    path: '/base/first',
                    next: '/base/teststep'
                },
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    invalid: true
                }
            ]);
        });

        it('Calls next if no next query', () => {
            req.query = {};
            controller.checkProceedToNextStep(req, res, next);
            next.should.have.been.calledWithExactly();
            controller.successHandler.should.not.have.been.called;
        });

        it('Calls success handler if this step has completed before and is now invalid', () => {
            controller.checkProceedToNextStep(req, res, next);
            next.should.not.have.been.called;
            controller.successHandler.should.have.been.calledWithExactly(req, res, next);
            req.notRevalidated.should.be.true;
        });

        it('Calls next if revalidate is specified', () => {
            req.journeyModel.set('history', [
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    revalidate: true,
                    invalid: true
                }
            ]);
            controller.checkProceedToNextStep(req, res, next);
            next.should.have.been.calledWithExactly();
            controller.successHandler.should.not.have.been.called;
            expect(req.notRevalidated).to.not.be.true;
        });

        it('Calls next if step is not invalid', () => {
            req.journeyModel.set('history', [
                {
                    path: '/base/teststep',
                    next: '/base/nextstep'
                }
            ]);
            controller.checkProceedToNextStep(req, res, next);
            next.should.have.been.calledWithExactly();
            controller.successHandler.should.not.have.been.called;
        });
    });

    describe('setStepComplete', () => {
        beforeEach(() => {
            controller.addJourneyHistoryStep = sinon.stub();
            controller.getNextStepObject = sinon.stub().returns({
                url: 'nextstep',
                fields: ['field1', 'field2']
            });
        });

        it('if this step is allowed by prereq then update the prereq to have this step as its next', () => {
            options.prereqPath = '/base/prereq';
            req.journeyModel.set('history', [{
                path: '/base/prereq',
                next: '/original/next'
            }]);
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.should.have.been.calledTwice;
            controller.addJourneyHistoryStep.should.have.been.calledWithExactly(
                req,
                res,
                sinon.match.object
            );
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/prereq',
                    next: '/base/teststep',
                }
            );
        });

        it('adds step to history', () => {
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.should.have.been.calledWithExactly(
                req,
                res,
                sinon.match.object
            );
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    fields: [ 'field1', 'field2' ],
                    wizard: 'wizard'
                }
            );
        });

        it('adds custom path step to history if specified', () => {
            controller.setStepComplete(req, res, '/custom/route');
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/custom/route',
                    next: '/base/nextstep',
                    fields: [ 'field1', 'field2' ],
                    wizard: 'wizard'
                }
            );
        });

        it('sets skip to true if skip option is true', () => {
            controller.options.skip = true;
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    fields: [ 'field1', 'field2' ],
                    wizard: 'wizard',
                    skip: true
                }
            );
        });

        it('sets revalidate to true if revalidate option is true', () => {
            controller.options.revalidate = true;
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    fields: [ 'field1', 'field2' ],
                    revalidate: true,
                    wizard: 'wizard'
                }
            );
        });

        it('sets empty fields array if fields are empty', () => {
            controller.getNextStepObject.returns({
                url: 'nextstep'
            });
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    wizard: 'wizard'
                }
            );
        });

        it('translates field names if a journeyKey is given', () => {
            req.form.options.allFields = {
                f1: {},
                f2: { journeyKey: 'j2' },
            };
            controller.getNextStepObject.returns({
                url: 'nextstep',
                fields: ['f1', 'f2', 'f3']
            });
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    fields: ['f1', 'j2', 'f3'],
                    wizard: 'wizard'
                }
            );
        });

        it('appends step fields and decisionFields to fields', () => {
            req.form.options.fields = {
                f1: {},
                f2: {},
                f3: {}
            };
            req.form.options.allFields = {
                f1: {},
                f2: { journeyKey: 'j2' },
                f3: { journeyKey: 'j3' },
                f4: {}
            };
            req.form.options.decisionFields = [
                'd1',
                'f1',
                'd2'
            ];
            controller.getNextStepObject.returns({
                url: 'nextstep',
                fields: ['f1', 'f2', 'f4']
            });
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    fields: ['f1', 'j2', 'j3', 'f4', 'd1', 'd2'],
                    formFields: ['f1', 'j2', 'j3'],
                    wizard: 'wizard'
                }
            );
        });

        it('appends step fields and revalidateIf to formFields', () => {
            req.form.options.fields = {
                f1: {},
                f2: {},
                f3: {}
            };
            req.form.options.allFields = {
                f1: {},
                f2: { journeyKey: 'j2' },
                f3: { journeyKey: 'j3' },
                f4: {}
            };
            req.form.options.revalidateIf = [
                'd1',
                'f1',
                'd2'
            ];
            controller.getNextStepObject.returns({
                url: 'nextstep',
                fields: ['f1', 'f2', 'f4']
            });
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    fields: ['f1', 'j2', 'j3', 'f4'],
                    formFields: ['f1', 'j2', 'j3', 'd1', 'd2'],
                    wizard: 'wizard'
                }
            );
        });

        it('sets editing and continueOnEdit if in editing mode and continueOnEdit is in condition', () => {
            req.isEditing = true;
            controller.getNextStepObject.returns({
                url: 'nextstep',
                condition: { continueOnEdit: true }
            });
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    wizard: 'wizard',
                    editing: true,
                    continueOnEdit: true
                }
            );
        });

        it('does not set editing if in editing mode and the step was only revalidated', () => {
            req.isEditing = true;
            req.notRevalidated = true;
            controller.getNextStepObject.returns({
                url: 'nextstep',
                condition: { continueOnEdit: true }
            });
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    next: '/base/nextstep',
                    wizard: 'wizard'
                }
            );
        });

        it('sets no next if decodeCondition returns null', () => {
            controller.getNextStepObject.returns({
                url: null
            });
            controller.setStepComplete(req, res);
            controller.addJourneyHistoryStep.args[0][2].should.deep.equal(
                {
                    path: '/base/teststep',
                    wizard: 'wizard'
                }
            );
        });

    });

    describe('addJourneyHistoryStep', () => {
        it('creates a step history and adds step if there is no existing step history', () => {
            controller.addJourneyHistoryStep(req, res,
                { path: '/path/newstep', next: '/path/newnext', newitem: true }
            );
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/newstep', next: '/path/newnext', newitem: true }
            ]);
        });

        it('overwrites existing step if it is found', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' },
                { path: '/path/three', next: '/path/four' },
                { path: '/path/four', next: '/path/five' },
                { path: '/path/five', next: '/path/six' }
            ]);
            controller.addJourneyHistoryStep(req, res,
                { path: '/path/three', next: '/path/four', newitem: true }
            );
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' },
                { path: '/path/three', next: '/path/four', newitem: true },
                { path: '/path/four', next: '/path/five' },
                { path: '/path/five', next: '/path/six' }
            ]);
        });

        it('inserts step into history after previous step to maintain backwards compatibility', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/newstep' },
                { path: '/path/two', next: '/path/three' }
            ]);
            controller.addJourneyHistoryStep(req, res,
                { path: '/path/newstep', next: '/path/newnext', newitem: true }
            );
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/newstep' },
                { path: '/path/newstep', next: '/path/newnext', newitem: true },
                { path: '/path/two', next: '/path/three' }
            ]);
        });

        it('appends step to end of existing history', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' }
            ]);
            controller.addJourneyHistoryStep(req, res,
                { path: '/path/newstep', next: '/path/newnext', newitem: true }
            );
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' },
                { path: '/path/newstep', next: '/path/newnext', newitem: true }
            ]);
        });
    });

    describe('lastAllowedStep', () => {
        it('returns last allowed step', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' },
                { path: '/path/three', next: '/path/four' }
            ]);
            let step = controller.lastAllowedStep(req, res);
            step.path.should.equal('/path/three');
        });

        it('does not get stuck in a loop', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' },
                { path: '/path/three', next: '/path/four' },
                { path: '/path/four', next: '/path/two' }
            ]);
            let step = controller.lastAllowedStep(req, res);
            step.path.should.equal('/path/four');
        });
    });

    describe('invalidateJourneyHistoryStep', () => {
        it('invalidates a step in history', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' },
                { path: '/path/three', next: '/path/four' }
            ]);
            controller.invalidateJourneyHistoryStep(req, res, '/path/two');
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three', invalid: true },
                { path: '/path/three', next: '/path/four' }
            ]);
        });

        it('should do nothing if a matching history step is not found', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' }
            ]);
            controller.invalidateJourneyHistoryStep(req, res, '/path/seven');
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' }
            ]);
        });

        it('should do nothing if there is no step history', () => {
            controller.invalidateJourneyHistoryStep(req, res, '/path/seven');
            expect(req.journeyModel.get('history')).to.be.undefined;
        });
    });

    describe('removeJourneyHistoryStep', () => {
        it('truncates step history from a given step', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' },
                { path: '/path/three', next: '/path/four' }
            ]);
            controller.removeJourneyHistoryStep(req, res, '/path/two');
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/two' },
                { path: '/path/three', next: '/path/four' }
            ]);
        });

        it('should do nothing if a matching history step is not found', () => {
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' }
            ]);
            controller.removeJourneyHistoryStep(req, res, '/path/seven');
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/two' },
                { path: '/path/two', next: '/path/three' }
            ]);
        });

        it('should do nothing if there is no step history', () => {
            controller.removeJourneyHistoryStep(req, res, '/path/seven');
            expect(req.journeyModel.get('history')).to.be.undefined;
        });
    });

    describe('resetJourneyHistory', () => {
        it('removes wizard steps from the history', () => {
            options.name = 'wizard b';
            req.journeyModel.set('history', [
                { path: '/path/one', next: '/path/two', wizard: 'wizard a' },
                { path: '/path/two', next: '/path/three', wizard: 'wizard b' },
                { path: '/path/three', next: '/path/four', wizard: 'wizard a' },
                { path: '/path/four', next: '/path/five', wizard: 'wizard b' }
            ]);
            controller.resetJourneyHistory(req, res);
            req.journeyModel.get('history').should.deep.equal([
                { path: '/path/one', next: '/path/two', wizard: 'wizard a' },
                { path: '/path/three', next: '/path/four', wizard: 'wizard a' }
            ]);
        });

        it('should do nothing if there is no step history', () => {
            controller.resetJourneyHistory(req, res);
            req.journeyModel.get('history').should.eql([]);
        });
    });

});

