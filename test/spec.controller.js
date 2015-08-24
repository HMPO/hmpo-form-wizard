var Controller = require('../lib/controller'),
    ErrorClass = require('../lib/error'),
    Form = require('hmpo-form-controller');

describe('Form Controller', function () {

    var controller, req, res, next;

    beforeEach(function () {
        req = request();
        res = response();
        next = sinon.stub();
        controller = new Controller({
            template: 'index',
            fields: {
                field1: {},
                field2: {}
            }
        });
    });

    describe('validators', function () {

        it('exposes validators', function () {
            Controller.validators.should.eql(Form.validators);
        });

    });

    describe('formatters', function () {

        it('exposes formatters', function () {
            Controller.formatters.should.eql(Form.formatters);
        });

    });

    describe('Error', function () {

        it('is an instance of Wizard.Error', function () {
            var err = new controller.Error('key', { type: 'required' });
            err.should.be.an.instanceOf(ErrorClass);
        });

    });

    describe('getErrors', function () {

        it('only returns errors from fields relevant to the current step', function () {
            req.sessionModel.set('errors', {
                field1: 'foo',
                field3: 'bar'
            });
            var errors = controller.getErrors(req, res);
            errors.should.eql({ field1: 'foo' });
        });

        it('does not return errors with a redirect property', function () {
           req.sessionModel.set('errors', {
                field1: {
                    redirect: '/exit-page'
                },
                field2: {
                    message: 'message'
                }
            });
            var errors = controller.getErrors(req, res);
            errors.should.eql({ field2: { message: 'message' } });
        });

    });

    describe('errorHandler', function () {

        beforeEach(function () {
            sinon.stub(Form.prototype, 'errorHandler');
            sinon.stub(Controller.prototype, 'missingPrereqHandler');
        });

        afterEach(function () {
            Form.prototype.errorHandler.restore();
            Controller.prototype.missingPrereqHandler.restore();
        });

        it('calls missingPrereqHandler for missing prerquisite errors', function () {
            var err = new Error('foo');
            err.code = 'MISSING_PREREQ';
            controller.errorHandler(err, req, res, next);
            controller.missingPrereqHandler.should.have.been.calledWithExactly(req, res, next);
        });

        it('passes through to parent errorHandler for all other errors', function () {
            var err = new Error('foo');
            controller.errorHandler(err, req, res, next);
            Form.prototype.errorHandler.should.have.been.calledWithExactly(err, req, res, next);
            Form.prototype.errorHandler.should.have.been.calledOn(controller);
        });

    });

    describe('missingPrereqHandler', function () {

        beforeEach(function () {
            controller.options.steps = {
                '/one': { next: '/two' },
                '/two': { next: '/three' },
                '/three': { next: '/four' },
                '/four': {}
            };
        });

        it('redirects to the step following the most recently completed', function () {
            req.sessionModel.set('steps', ['/one']);
            controller.missingPrereqHandler(req, res, next);
            res.redirect.should.have.been.calledWith('/two');
        });

        it('redirects to the first step if no steps have been completed', function () {
            req.sessionModel.set('steps', []);
            controller.missingPrereqHandler(req, res, next);
            res.redirect.should.have.been.calledWith('/one');
        });

    });

});