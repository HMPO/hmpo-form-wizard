'use strict';

const Controller = require('../../lib/controller');
const ErrorClass = require('../../lib/error');
const Form = require('hmpo-form-controller');
const proxyquire = require('proxyquire');

describe('Form Controller', () => {

    let req, res, next, options;

    beforeEach(() => {
        req = request({
            baseUrl: '/base'
        });
        res = response();
        next = sinon.stub();
        options = {
            route: '/route',
            template: 'template',
            fields: {
                field1: {},
                field2: {}
            }
        };
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

    describe('missingPrereqHandler', () => {
        let controller;

        beforeEach(() => {
            options.steps = {
                '/one': { next: '/two' },
                '/two': { next: '/three' },
                '/three': { next: '/four' },
                '/four': {}
            };
            controller = new Controller(options);
        });

        it('redirects to the step following the most recently completed', () => {
            req.sessionModel.set('steps', ['/one']);
            controller.missingPrereqHandler(req, res, next);
            res.redirect.should.have.been.calledWith('/base/two');
        });

        it('redirects to the most recently completed if it has no next step', () => {
            req.sessionModel.set('steps', ['/four']);
            controller.missingPrereqHandler(req, res, next);
            res.redirect.should.have.been.calledWith('/base/four');
        });

        it('redirects to the first step if no steps have been completed', () => {
            req.sessionModel.set('steps', []);
            controller.missingPrereqHandler(req, res, next);
            res.redirect.should.have.been.calledWith('/base/one');
        });

    });

    describe('errorHandler', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
        });

        beforeEach(() => {
            sinon.stub(Form.prototype, 'errorHandler');
            sinon.stub(Controller.prototype, 'missingPrereqHandler');
        });

        afterEach(() => {
            Form.prototype.errorHandler.restore();
            Controller.prototype.missingPrereqHandler.restore();
        });

        it('calls missingPrereqHandler for missing prerquisite errors', () => {
            let err = new Error('foo');
            err.code = 'MISSING_PREREQ';
            controller.errorHandler(err, req, res, next);
            controller.missingPrereqHandler.should.have.been.calledWithExactly(req, res, next);
        });

        it('passes through to parent errorHandler for all other errors', () => {
            let err = new Error('foo');
            controller.errorHandler(err, req, res, next);
            Form.prototype.errorHandler.should.have.been.calledWithExactly(err, req, res, next);
            Form.prototype.errorHandler.should.have.been.calledOn(controller);
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


    describe('requestHandler', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(Form.prototype, 'requestHandler');
            sinon.stub(Controller.prototype, 'middlewareSetup');
            sinon.stub(Controller.prototype, 'middlewareChecks');
            sinon.stub(Controller.prototype, 'middlewareActions');
            sinon.stub(Controller.prototype, 'middlewareLocals');
        });

        afterEach(() => {
            Form.prototype.requestHandler.restore();
            Controller.prototype.middlewareSetup.restore();
            Controller.prototype.middlewareChecks.restore();
            Controller.prototype.middlewareActions.restore();
            Controller.prototype.middlewareLocals.restore();
        });

        it('should call the middleware setup methods', () => {
            controller.requestHandler();
            Controller.prototype.middlewareSetup.should.have.been.calledOnce;
            Controller.prototype.middlewareChecks.should.have.been.calledOnce;
            Controller.prototype.middlewareActions.should.have.been.calledOnce;
            Controller.prototype.middlewareLocals.should.have.been.calledOnce;
        });

        it('should call form-controllers requestHandler method', () => {
            controller.requestHandler();
            Form.prototype.requestHandler.should.have.been.calledOnce;
        });

        it('should return the router from the form-controllers requestHandler', () => {
            Form.prototype.requestHandler.returns('A Router');
            controller.requestHandler().should.equal('A Router');
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
        [
            'resolve-path',
            'base-url',
            'translate',
            'session-model',
            'check-session',
            'check-progress',
            'csrf',
            'invalidate-fields',
            'back-links'
        ].forEach(mixin => {
            it('should should run the ' + mixin + ' mixin function', () => {
                let mixinFunction = sinon.stub().returnsArg(0);

                proxyquire('../../lib/controller', {
                    ['./mixins/' + mixin]: mixinFunction
                });

                mixinFunction.should.have.been.calledOnce;
                mixinFunction.should.have.been.calledWithExactly(sinon.match.func);
            });
        });

    });

});
