'use strict';

const Controller = require('../../lib/controller');
const ErrorClass = require('../../lib/error');
const Form = require('hmpo-form-controller');
const proxyquire = require('proxyquire');

describe('Form Controller', () => {

    let req, res, next, options;

    beforeEach(() => {
        options = {
            route: '/route',
            template: 'template',
            fields: {
                field1: {},
                field2: {},
                field8: {},
                field9: {}
            }
        };
        req = request({
            form: { options },
            originalUrl: '/base/route',
            baseUrl: '/base',
            path: '/route'
        });
        res = response();
        next = sinon.stub();
    });

    it('exposes validators', () => {
        Controller.validators.should.eql(Form.validators);
    });

    it('exposes formatters', () => {
        Controller.formatters.should.eql(Form.formatters);
    });

    it('exposes ErrorClass as static and as an instance property', () => {
        Controller.Error.should.equal(ErrorClass);
        let controller = new Controller(options);
        controller.Error.should.equal(ErrorClass);
    });

    describe('constructor', () => {
        it('throws an error if no route is specified', () => {
            expect(() => new Controller({})).to.throw();
        });

        it('prepends templatePath to the tempate', () => {
            options.templatePath = 'template/path';
            let controller = new Controller(options);
            controller.options.template.should.equal('template/path/template');
        });

        it('doesn\'t prepend template path if omitted', () => {
            let controller = new Controller(options);
            controller.options.template.should.equal('template');
        });

        it('should default the template to the route name', () => {
            delete options.template;
            let controller = new Controller(options);
            controller.options.template.should.equal('route');
        });

        it('should default the template to index if the route is /', () => {
            delete options.template;
            options.route = '/';
            let controller = new Controller(options);
            controller.options.template.should.equal('index');
        });

        it('should remove post method if noPost option is set', () =>{
            options.noPost  = true;
            let controller = new Controller(options);
            expect(controller.post).to.be.null;
        });

        it('should leave post method if noPost option is not set', () =>{
            let controller = new Controller(options);
            controller.post.should.be.a.function;
        });

    });

    describe('errorHandler', () => {
        let err;
        beforeEach(() => {
            err = new Error();
            sinon.stub(Controller.prototype, 'isValidationError').returns(true);
            sinon.stub(Controller.prototype, 'setErrors');
            sinon.stub(Form.prototype, 'errorHandler');
        });

        afterEach(() => {
            Controller.prototype.isValidationError.restore();
            Controller.prototype.setErrors.restore();
            Form.prototype.errorHandler.restore();
        });

        it('should call setErrors and call next if skip is true', () => {
            options.skip = true;
            let controller = new Controller(options);
            controller.errorHandler(err, req, res, next);
            Controller.prototype.setErrors.should.have.been.calledWithExactly(err, req, res);
            next.should.have.been.calledWithExactly(err);
            Form.prototype.errorHandler.should.not.have.been.called;
        });

        it('should call parent error handler if skip is false', () => {
            options.skip = false;
            let controller = new Controller(options);
            controller.errorHandler(err, req, res, next);
            next.should.not.have.been.called;
            Form.prototype.errorHandler.should.have.been.calledWithExactly(err, req, res, next);
        });

        it('should call parent error handler if err is not a validation error', () => {
            options.skip = true;
            Controller.prototype.isValidationError.returns(false);
            let controller = new Controller(options);
            controller.errorHandler(err, req, res, next);
            next.should.not.have.been.called;
            Form.prototype.errorHandler.should.have.been.calledWithExactly(err, req, res, next);
        });
    });


    describe('_checkStatus', () => {
        beforeEach(() => {
            sinon.stub(Controller.prototype, 'post');
            sinon.stub(Controller.prototype, 'setStepComplete');
            sinon.stub(Controller.prototype, 'successHandler');
        });

        afterEach(() => {
            Controller.prototype.post.restore();
            Controller.prototype.setStepComplete.restore();
            Controller.prototype.successHandler.restore();
        });

        it('should call post if skip is true', () => {
            options.skip = true;
            let controller = new Controller(options);
            controller._checkStatus(req, res, next);
            next.should.not.have.been.called;
            Controller.prototype.post.should.have.been.calledWithExactly(req, res, next);
        });

        it('should call the next callback if skip is not set', () => {
            let controller = new Controller(options);
            controller._checkStatus(req, res, next);
            Controller.prototype.post.should.not.have.been.called;
            next.should.have.been.calledWithExactly();
        });

        it('should call the successHandler if skip is set but there is no post method', () => {
            options.skip = true;
            let controller = new Controller(options);
            controller.post = null;
            controller._checkStatus(req, res, next);
            next.should.not.have.been.called;
            Controller.prototype.successHandler.should.have.been.calledWithExactly(req, res, next);
        });

        it('should call setStepComplete if the step has a next page and no post method', () => {
            res.locals.nextPage = '/next/page';
            let controller = new Controller(options);
            controller.post = null;
            controller._checkStatus(req, res, next);
            Controller.prototype.setStepComplete.should.have.been.calledOnce;
            Controller.prototype.setStepComplete.should.have.been.calledWithExactly(req, res);
            next.should.have.been.calledWithExactly();
        });

        it('should not call setStepComplete if the next page is the same as the current url', () => {
            res.locals.nextPage = '/base/route';
            let controller = new Controller(options);
            controller.post = null;
            controller._checkStatus(req, res, next);
            Controller.prototype.setStepComplete.should.not.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });

    describe('successHandler', () => {
        let controller;

        beforeEach(() => {
            sinon.stub(Controller.prototype, 'setStepComplete');
            sinon.stub(Controller.prototype, 'getNextStep').returns('/next/step');
            controller = new Controller(options);
        });

        afterEach(() => {
            Controller.prototype.setStepComplete.restore();
            Controller.prototype.getNextStep.restore();
        });

        it('should call setStepComplete', () => {
            controller.successHandler(req, res, next);
            Controller.prototype.setStepComplete.should.have.been.calledOnce;
            Controller.prototype.setStepComplete.should.have.been.calledWithExactly(req, res);
        });

        it('should redirect to the next step', () => {
            controller.successHandler(req, res, next);
            Controller.prototype.getNextStep.should.have.been.calledOnce;
            Controller.prototype.getNextStep.should.have.been.calledWithExactly(req, res);
            res.redirect.should.have.been.calledWithExactly('/next/step');
        });

    });

    describe('getValues', () => {
        let controller, cb;

        beforeEach(() => {
            controller = new Controller(options);
            cb = sinon.stub();
        });

        it('calls callback with session model values and error values of current fields', () => {
            req.sessionModel.set({
                field1: 'foo',
                field2: 'bar',
                field3: 'boo',
                field4: 'baz',
                errorValues: {
                    field2: 'error value 2',
                    field4: 'error value 4'
                }
            });
            controller.getValues(req, res, cb);
            cb.should.have.been.calledWithExactly(
                null,
                {
                    field1: 'foo',
                    field2: 'error value 2',
                    field3: 'boo',
                    field4: 'baz'
                }
            );
        });

        it('calls callback without error values that are from a different url', () => {
            req.sessionModel.set({
                field1: 'foo',
                field2: 'bar',
                field3: 'boo',
                field4: 'baz',
                errors: {
                    field2: { },
                    field8: { url: '/route' },
                    field9: { url: '/another/url' }
                },
                errorValues: {
                    field1: 'error value 1',
                    field2: 'error value 2',
                    field8: 'error value 8',
                    field9: 'error value 9'
                }
            });
            controller.getValues(req, res, cb);
            cb.should.have.been.calledWithExactly(
                null,
                {
                    field1: 'error value 1',
                    field2: 'error value 2',
                    field3: 'boo',
                    field4: 'baz',
                    field8: 'error value 8'
                }
            );
        });
    });

    describe('saveValues', () => {
        let controller, cb;

        beforeEach(() => {
            controller = new Controller(options);
            cb = sinon.stub();
            req.sessionModel.set({
                field1: 'foo',
                field2: 'bar',
                field3: 'boo',
                field4: 'baz',
                errorValues: {
                    field2: 'error value 2',
                    field4: 'error value 4'
                }
            });
            req.form = { values: {
                field1: 'field 1 value',
                field4: 'field 4 value'
            }};
        });

        it('saves form values to the session model', () => {
            controller.saveValues(req, res, cb);
            cb.should.have.been.calledWithExactly();
            req.sessionModel.toJSON().should.deep.equal({
                field1: 'field 1 value',
                field2: 'bar',
                field3: 'boo',
                field4: 'field 4 value'
            });
        });

        it('unsets errorValues', () => {
            controller.saveValues(req, res, cb);
            cb.should.have.been.calledWithExactly();
            expect(req.sessionModel.get('errorValues')).to.be.undefined;
        });
    });

    describe('getErrors', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
        });

        it('only returns errors from fields relevant to the current step', () => {
            req.sessionModel.set('errors', {
                field1: 'foo',
                field3: 'bar'
            });
            let errors = controller.getErrors(req, res);
            errors.should.eql({ field1: 'foo' });
        });

        it('only returns errors from the current url if one is present', () => {
            req.path = '/url';
            req.sessionModel.set('errors', {
                field1: { code: 'foo', url: '/another/url' },
                field2: { code: 'baz', url: '/url' },
                field3: 'bar'
            });
            let errors = controller.getErrors(req, res);
            errors.should.eql({
                field2: { code: 'baz', url: '/url' }
            });
        });

        it('does not return errors with a redirect property', () => {
            req.sessionModel.set('errors', {
                field1: {
                    redirect: '/exit-page'
                },
                field2: {
                    message: 'message'
                }
            });
            let errors = controller.getErrors(req, res);
            errors.should.eql({ field2: { message: 'message' } });
        });

    });

    describe('setErrors', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
        });

        it('sets the error values to the current form values', () => {
            req.form = { values: {
                field1: 'field 1 value',
                field4: 'field 4 value'
            }};
            controller.setErrors({}, req, res);
            req.sessionModel.get('errorValues').should.deep.equal({
                field1: 'field 1 value',
                field4: 'field 4 value'
            });
        });

        it('skips setting errorValues if there are no form values', () => {
            controller.setErrors({}, req, res);
            req.sessionModel.toJSON().should.not.contain.keys('errorValues');
        });

        it('sets error to session model', () => {
            let err = {};
            controller.setErrors(err, req, res);
            req.sessionModel.get('errors').should.equal(err);
        });
    });

    describe('locals', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(Controller.prototype, 'getNextStep').returns('/next/step');
        });

        afterEach(() => {
            Controller.prototype.getNextStep.restore();
        });

        it('returns initial locals', () => {
            req.baseUrl = '/base';
            controller.locals(req, res).should.deep.equal({
                baseUrl: '/base',
                nextPage: '/next/step'
            });

        });
    });

    describe('use', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(Form.prototype, 'use');
        });

        afterEach(() => {
            Form.prototype.use.restore();
        });

        it('should call the parent use with a flattened list of middleware', () => {
            let fn = sinon.stub();
            controller.use([fn, [fn, fn, [fn, fn]]]);
            Form.prototype.use.should.have.been.calledWithExactly(
                sinon.match.func,
                sinon.match.func,
                sinon.match.func,
                sinon.match.func,
                sinon.match.func
            );
        });

        it('should call use with functions bound to the controller instance', () => {
            let fn = sinon.stub();
            Form.prototype.use.yields();
            controller.use(fn);
            fn.should.have.been.calledOn(controller);
        });
    });


    describe('middlewareMixins', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(Controller.prototype, 'middlewareSetup');
            sinon.stub(Controller.prototype, 'middlewareChecks');
            sinon.stub(Controller.prototype, 'middlewareActions');
            sinon.stub(Controller.prototype, 'middlewareLocals');
        });

        afterEach(() => {
            Controller.prototype.middlewareSetup.restore();
            Controller.prototype.middlewareChecks.restore();
            Controller.prototype.middlewareActions.restore();
            Controller.prototype.middlewareLocals.restore();
        });

        it('should call the middleware setup methods', () => {
            controller.middlewareMixins();
            Controller.prototype.middlewareSetup.should.have.been.calledOnce;
            Controller.prototype.middlewareChecks.should.have.been.calledOnce;
            Controller.prototype.middlewareActions.should.have.been.calledOnce;
            Controller.prototype.middlewareLocals.should.have.been.calledOnce;
        });
    });

    describe('middleware setup functions', () => {
        let controller;

        beforeEach(() => {
            sinon.stub(Controller.prototype, 'use');
            controller = new Controller(options);
        });

        afterEach(() => {
            Controller.prototype.use.restore();
        });

        it('should set up middleware in overridden middlewareSetup method', () => {
            controller.middlewareSetup();
            Controller.prototype.use.should.have.been.called;
            Controller.prototype.use.should.have.been.calledWithExactly(sinon.match.func);
        });

        it('should set up middleware in overridden middlewareChecks method', () => {
            controller.middlewareChecks();
            Controller.prototype.use.should.have.been.called;
            Controller.prototype.use.should.have.been.calledWithExactly(sinon.match.func);
        });

        it('should set up middleware in overridden middlewareActions method', () => {
            controller.middlewareActions();
            Controller.prototype.use.should.have.been.called;
            Controller.prototype.use.should.have.been.calledWithExactly(sinon.match.func);
        });

        it('should set up middleware in overridden middlewareLocals method', () => {
            controller.middlewareLocals();
            Controller.prototype.use.should.have.been.called;
            Controller.prototype.use.should.have.been.calledWithExactly(sinon.match.func);
        });
    });

    describe('mixins', () => {
        const mixins = [
            'resolve-path',
            'base-url',
            'translate',
            'journey-model',
            'session-model',
            'check-session',
            'check-progress',
            'csrf',
            'invalidate-fields',
            'import',
            'back-links',
            'next-step',
            'edit-step'
        ];

        mixins.forEach(mixin => {
            it('should should run the ' + mixin + ' mixin function', () => {
                let mixinFunction = sinon.stub().returnsArg(0);
                proxyquire('../../lib/controller', {
                    ['./mixins/' + mixin]: mixinFunction
                });

                mixinFunction.should.have.been.calledOnce;
                mixinFunction.should.have.been.calledWithExactly(sinon.match.func);
            });
        });

        mixins.slice(1).forEach((mixin, index) => {
            let previousMixin = mixins[index];
            it('should should run the ' + mixin + ' mixin function after ' + previousMixin, () => {
                let mixinFunction = sinon.stub().returnsArg(0);
                let previousMixinFunction = sinon.stub().returnsArg(0);

                proxyquire('../../lib/controller', {
                    ['./mixins/' + mixin]: mixinFunction,
                    ['./mixins/' + previousMixin]: previousMixinFunction
                });

                mixinFunction.should.have.been.calledAfter(previousMixinFunction);
            });
        });

    });

});
