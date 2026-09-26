'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const invalidateTask = require('../../../lib/controller/mixins/invalidate-task');

describe('mixins/invalidate-task', () => {

    let BaseController, StubController;
    let req, res, next, controller, steps;

    beforeEach(() => {
        steps = {
            '/step1': {
                route: '/step1'
            },
            '/step2': {
                route: '/step2'
            }
        };

        let options = {
            route: '/step1',
            steps,
            fields: steps['/step1'].fields
        };

        req = request({
            form: { options },
            baseUrl: '/base'
        });
        res = response();
        next = sinon.stub();

        req.sessionModel.set({
            'maritalMaritalStatus': 'MarriageDissolved',
            'previousNamesMarriage': 'Yes',
            'previousNamesByMarriage': 'Smith',
            'previousNamesMarriageCertificate': 'file.pdf',
            'maritalStatusComplete': 'completed',
            'previousNamesComplete': 'completed'
        });

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = invalidateTask(BaseController);
        controller = new StubController(options);
    });

    it('should export a function', () => {
        invalidateTask.should.be.a('function');
        invalidateTask.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareActions override', () => {
        it('calls the super method', () => {
            controller.middlewareActions();
            BaseController.prototype.middlewareActions.should.have.been.calledOnce;
        });

        it('uses the invalidateTask middleware', () => {
            controller.middlewareActions();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.invalidateTask
            );
        });
    });

    describe('invalidateTask middleware', () => {

        it('calls next when no invalidatesTask declarations exist', () => {
            req.form.options.fields = {
                someField: { type: 'text' }
            };
            controller.invalidateTask(req, res, next);
            next.should.have.been.calledOnce;
        });

        it('calls next when invalidatesTask declarations exist', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete',
                        fields: ['previousNamesMarriage', 'previousNamesByMarriage']
                    }]
                }
            };
            controller.invalidateTask(req, res, next);
            next.should.have.been.calledOnce;
        });

        it('clears task flag and fields when field changes to a matching value', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete',
                        fields: ['previousNamesMarriage', 'previousNamesByMarriage', 'previousNamesMarriageCertificate']
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            // Change marital status to Single
            req.sessionModel.set('maritalMaritalStatus', 'Single');

            // Task flag should be cleared
            expect(req.sessionModel.get('previousNamesComplete')).to.be.undefined;
            // Associated fields should be cleared
            expect(req.sessionModel.get('previousNamesMarriage')).to.be.undefined;
            expect(req.sessionModel.get('previousNamesByMarriage')).to.be.undefined;
            expect(req.sessionModel.get('previousNamesMarriageCertificate')).to.be.undefined;
        });

        it('does not clear task flag when field changes to a non-matching value', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete',
                        fields: ['previousNamesMarriage', 'previousNamesByMarriage']
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            // Change marital status to Divorced (not Single)
            req.sessionModel.set('maritalMaritalStatus', 'Divorced');

            // Task flag should remain
            req.sessionModel.get('previousNamesComplete').should.equal('completed');
            // Associated fields should remain
            req.sessionModel.get('previousNamesMarriage').should.equal('Yes');
        });

        it('does not clear task flag when field is set to the same value', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['MarriageDissolved'],
                        taskFlag: 'previousNamesComplete'
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            // Set to same value (MarriageDissolved) - change event won't fire
            req.sessionModel.set('maritalMaritalStatus', 'MarriageDissolved');

            // Task flag should remain since value didn't actually change
            req.sessionModel.get('previousNamesComplete').should.equal('completed');
        });

        it('respects condition - only invalidates when condition field matches', () => {
            req.sessionModel.set('maritalMaritalStatus', 'Single');

            req.form.options.fields = {
                previousNamesMarriage: {
                    invalidatesTask: [{
                        values: ['Yes', 'YesMoreThanOnce'],
                        taskFlag: 'maritalStatusComplete',
                        condition: { field: 'maritalMaritalStatus', values: ['Single'] }
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            // Change previous names marriage to Yes while marital status IS Single
            req.sessionModel.set('previousNamesMarriage', 'YesMoreThanOnce');

            // Task flag should be cleared because condition is met
            expect(req.sessionModel.get('maritalStatusComplete')).to.be.undefined;
        });

        it('respects condition - does not invalidate when condition field does not match', () => {
            // maritalMaritalStatus is 'MarriageDissolved' (not 'Single')
            req.form.options.fields = {
                previousNamesMarriage: {
                    invalidatesTask: [{
                        values: ['Yes', 'YesMoreThanOnce'],
                        taskFlag: 'maritalStatusComplete',
                        condition: { field: 'maritalMaritalStatus', values: ['Single'] }
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            // Change previous names - but marital status is NOT Single
            req.sessionModel.set('previousNamesMarriage', 'YesMoreThanOnce');

            // Task flag should remain because condition is not met
            req.sessionModel.get('maritalStatusComplete').should.equal('completed');
        });

        it('handles multiple rules on the same field', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [
                        {
                            values: ['Single'],
                            taskFlag: 'previousNamesComplete',
                            fields: ['previousNamesMarriage']
                        },
                        {
                            values: ['Single', 'MarriageDissolved'],
                            taskFlag: 'maritalStatusComplete'
                        }
                    ]
                }
            };
            controller.invalidateTask(req, res, next);

            req.sessionModel.set('maritalMaritalStatus', 'Single');

            expect(req.sessionModel.get('previousNamesComplete')).to.be.undefined;
            expect(req.sessionModel.get('maritalStatusComplete')).to.be.undefined;
        });

        it('only clears taskFlag when fields array is not provided', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete'
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            req.sessionModel.set('maritalMaritalStatus', 'Single');

            expect(req.sessionModel.get('previousNamesComplete')).to.be.undefined;
            // Other fields should remain untouched
            req.sessionModel.get('previousNamesMarriage').should.equal('Yes');
            req.sessionModel.get('previousNamesByMarriage').should.equal('Smith');
        });

        it('does not clear fields when fields array is empty', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete',
                        fields: []
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            req.sessionModel.set('maritalMaritalStatus', 'Single');

            expect(req.sessionModel.get('previousNamesComplete')).to.be.undefined;
            // Fields should remain untouched since fields array is empty
            req.sessionModel.get('previousNamesMarriage').should.equal('Yes');
            req.sessionModel.get('previousNamesByMarriage').should.equal('Smith');
        });

        it('clears fields without taskFlag when taskFlag is not provided', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        fields: ['previousNamesMarriage', 'previousNamesByMarriage']
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            req.sessionModel.set('maritalMaritalStatus', 'Single');

            // Task flags should remain since no taskFlag specified
            req.sessionModel.get('previousNamesComplete').should.equal('completed');
            // But specified fields should be cleared
            expect(req.sessionModel.get('previousNamesMarriage')).to.be.undefined;
            expect(req.sessionModel.get('previousNamesByMarriage')).to.be.undefined;
        });

        it('sets req._taskInvalidated when a rule fires', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete'
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            expect(req._taskInvalidated).to.be.undefined;
            req.sessionModel.set('maritalMaritalStatus', 'Single');
            req._taskInvalidated.should.equal(true);
        });

        it('does not set req._taskInvalidated when no rule fires', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete'
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            req.sessionModel.set('maritalMaritalStatus', 'Divorced');
            expect(req._taskInvalidated).to.be.undefined;
        });

        it('sets req._taskInvalidatedRedirect when rule has redirectTo', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete',
                        redirectTo: 'previous-name-marriage'
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            req.sessionModel.set('maritalMaritalStatus', 'Single');
            req._taskInvalidatedRedirect.should.equal('previous-name-marriage');
        });

        it('does not set req._taskInvalidatedRedirect when rule has no redirectTo', () => {
            req.form.options.fields = {
                maritalMaritalStatus: {
                    invalidatesTask: [{
                        values: ['Single'],
                        taskFlag: 'previousNamesComplete'
                    }]
                }
            };
            controller.invalidateTask(req, res, next);

            req.sessionModel.set('maritalMaritalStatus', 'Single');
            expect(req._taskInvalidatedRedirect).to.be.undefined;
        });
    });

    describe('successHandler', () => {

        beforeEach(() => {
            req.form.options.steps = {
                '/task-list': { route: '/task-list', hub: true },
                '/marital-status': { route: '/marital-status' },
                '/previous-name-marriage': { route: '/previous-name-marriage' },
                '/check-your-answers': { route: '/check-your-answers' }
            };
            req.form.options.fullPath = '/base/marital-status';
            req.form.options.checkJourney = true;
            controller.setStepComplete = sinon.stub();
        });

        it('redirects to redirectTo step when editing and task was invalidated with redirectTo', () => {
            req.isEditing = true;
            req._taskInvalidated = true;
            req._taskInvalidatedRedirect = 'previous-name-marriage';

            controller.successHandler(req, res, next);

            res.redirect.should.have.been.calledOnce;
            res.redirect.should.have.been.calledWithExactly('/base/previous-name-marriage');
            controller.setStepComplete.should.have.been.calledOnce;
        });

        it('redirects to hub when editing and task was invalidated without redirectTo', () => {
            req.isEditing = true;
            req._taskInvalidated = true;

            controller.successHandler(req, res, next);

            res.redirect.should.have.been.calledOnce;
            res.redirect.should.have.been.calledWithExactly('/base/task-list');
            controller.setStepComplete.should.have.been.calledOnce;
        });

        it('calls super.successHandler when not editing', () => {
            req.isEditing = false;
            req._taskInvalidated = true;

            BaseController.prototype.successHandler = sinon.stub();
            controller.successHandler(req, res, next);

            res.redirect.should.not.have.been.called;
            BaseController.prototype.successHandler.should.have.been.calledOnce;
        });

        it('calls super.successHandler when editing but no task invalidated', () => {
            req.isEditing = true;
            req._taskInvalidated = undefined;

            BaseController.prototype.successHandler = sinon.stub();
            controller.successHandler(req, res, next);

            res.redirect.should.not.have.been.called;
            BaseController.prototype.successHandler.should.have.been.calledOnce;
        });

        it('calls super.successHandler when editing with task invalidated but no redirect or hub', () => {
            req.isEditing = true;
            req._taskInvalidated = true;
            req.form.options.steps = {
                '/marital-status': { route: '/marital-status' },
                '/check-your-answers': { route: '/check-your-answers' }
            };

            BaseController.prototype.successHandler = sinon.stub();
            controller.successHandler(req, res, next);

            res.redirect.should.not.have.been.called;
            BaseController.prototype.successHandler.should.have.been.calledOnce;
        });
    });

    describe('_getTaskInvalidatedRedirect', () => {

        beforeEach(() => {
            req.form.options.steps = {
                '/task-list': { route: '/task-list', hub: true },
                '/previous-name-marriage': { route: '/previous-name-marriage' }
            };
        });

        it('returns the redirectTo path when set on req', () => {
            req._taskInvalidatedRedirect = 'previous-name-marriage';
            let result = controller._getTaskInvalidatedRedirect(req);
            result.should.equal('/base/previous-name-marriage');
        });

        it('falls back to hub path when no redirectTo is set', () => {
            let result = controller._getTaskInvalidatedRedirect(req);
            result.should.equal('/base/task-list');
        });

        it('returns undefined when no redirectTo and no hub', () => {
            req.form.options.steps = {
                '/step1': { route: '/step1' }
            };
            let result = controller._getTaskInvalidatedRedirect(req);
            expect(result).to.be.undefined;
        });
    });

    describe('_findHubPath', () => {

        it('returns the resolved hub path when a hub step exists', () => {
            req.form.options.steps = {
                '/task-list': { route: '/task-list', hub: true },
                '/other': { route: '/other' }
            };

            let result = controller._findHubPath(req);
            result.should.equal('/base/task-list');
        });

        it('returns undefined when no hub step exists', () => {
            req.form.options.steps = {
                '/step1': { route: '/step1' },
                '/step2': { route: '/step2' }
            };

            let result = controller._findHubPath(req);
            expect(result).to.be.undefined;
        });
    });

});
