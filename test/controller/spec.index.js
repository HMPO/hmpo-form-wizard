'use strict';

const Controller = require('../../lib/controller');
const ErrorClass = require('../../lib/error');
const formatting = require('../../lib/formatting');
const validation = require('../../lib/validation');
// const _ = require('underscore');

const proxyquire = require('proxyquire');
const express = require('express');

describe('Form Controller', () => {

    let req, res, next, callback, options;

    beforeEach(() => {
        options = {
            route: '/route',
            checkJourney: true,
            next: 'nextstep',
            template: 'template',
            fields: {
                field1: {},
                field2: {},
                field8: {},
                field9: {}
            }
        };
        req = request({
            method: 'GET',
            protocol: 'http:',
            originalUrl: '/base/route?this=is&a=query',
            url: '/route',
            baseUrl: '/base',
            path: '/route',
            form: { options },
        });
        res = response();
        next = sinon.stub();
        callback = sinon.stub();
    });

    it('exposes validators', () => {
        Controller.validators.should.equal(validation.validators);
    });

    it('exposes formatters', () => {
        Controller.formatters.should.equal(formatting.formatters);
    });

    it('exposes ErrorClass as static and as an instance property', () => {
        Controller.Error.should.equal(ErrorClass);
        let controller = new Controller(options);
        controller.Error.should.equal(ErrorClass);
    });

    describe('constructor', () => {
        it('throws an error if no options are specified', () => {
            expect(() => new Controller(null)).to.throw();
        });

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

        it('should remove get method if noGet option is set', () =>{
            options.noGet  = true;
            let controller = new Controller(options);
            expect(controller.get).to.be.null;
        });

        it('should remove post method if noPost option is set', () =>{
            options.noPost  = true;
            let controller = new Controller(options);
            expect(controller.post).to.be.null;
        });

        it('should leave post method if noPost option is not set', () =>{
            let controller = new Controller(options);
            controller.post.should.be.a('function');
        });

        it('should default the fields to an empty object', () =>{
            delete options.fields;
            let controller = new Controller(options);
            controller.options.fields.should.deep.equal({});
        });

        it('should default allFields to the fields object', () =>{
            options.fields = { 'foo': {} };
            delete options.allFields;
            let controller = new Controller(options);
            controller.options.allFields.should.equal(options.fields);
        });

        it('should set default formatters', () =>{
            let controller = new Controller(options);
            controller.options.defaultFormatters.should.eql([
                'trim',
                'singlespaces',
                'hyphens',
                'apostrophes',
                'quotes'
            ]);
        });

        it('should allow default formatters set in options', () =>{
            options.defaultFormatters = [ 'hyphens' ];
            let controller = new Controller(options);
            controller.options.defaultFormatters.should.eql(['hyphens']);
        });

    });

    describe('_bindFunctions', () => {
        let controller, fn;

        beforeEach('', () => {
            controller = new Controller(options);
            fn = sinon.stub();
        });

        it('should return an array of functions', () => {
            let bound = controller._bindFunctions(fn);
            bound.should.be.an('array');
            bound.should.have.length(1);
            bound[0].should.be.a('function');
            bound[0]();
            fn.should.have.been.calledOn(controller);
        });

        it('should return functions bound to the controller', () => {
            let bound = controller._bindFunctions(fn);
            fn.should.not.have.been.called;
            bound[0]();
            fn.should.have.been.calledOnce;
            fn.should.have.been.calledOn(controller);
        });

        it('should flatten a tree of functions to a single array', () => {
            let bound = controller._bindFunctions(fn, [fn, fn], [[fn, fn], fn]);
            bound.should.be.an('array');
            bound.should.have.length(6);
        });
    });

    describe('use', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            controller.router = {
                use: sinon.stub()
            };
        });

        it('should call the parent use with a flattened list of middleware', () => {
            let fn = sinon.stub();
            controller.use([fn, [fn, fn, [fn, fn]]]);
            controller.router.use.should.have.been.calledWithExactly(
                sinon.match.func,
                sinon.match.func,
                sinon.match.func,
                sinon.match.func,
                sinon.match.func
            );
        });

        it('should call use with functions bound to the controller instance', () => {
            let fn = sinon.stub();
            controller.router.use.yields();
            controller.use(fn);
            fn.should.have.been.calledOn(controller);
        });

        it('should throw an error if no router has been set up yet', () => {
            delete controller.router;
            expect(() => controller.use()).to.throw();
        });
    });

    describe('useWithMethod', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            controller.router = {
                get: sinon.stub()
            };
        });

        it('should call the router use with a flattened list of middleware', () => {
            let fn = sinon.stub();
            controller.useWithMethod('get', [fn, [fn, fn, [fn, fn]]]);
            controller.router.get.should.have.been.calledWithExactly(
                '*',
                sinon.match.func,
                sinon.match.func,
                sinon.match.func,
                sinon.match.func,
                sinon.match.func
            );
        });

        it('should call router use with functions bound to the controller instance', () => {
            let fn = sinon.stub();
            controller.router.get.yields();
            controller.useWithMethod('get', fn);
            fn.should.have.been.calledOn(controller);
        });

        it('should throw an error if no router has been set up yet', () => {
            delete controller.router;
            expect(() => controller.useWithMethod('get')).to.throw();
        });
    });

    describe('requestHandler', () => {

        let controller, stubRouter;

        beforeEach(() => {
            controller = new Controller(options);
            stubRouter = {};
            sinon.stub(express, 'Router').returns(stubRouter);
            sinon.stub(controller, 'use');
            sinon.stub(controller, 'useWithMethod');
            sinon.stub(controller, 'middlewareMixins');
        });

        afterEach(() => {
            express.Router.restore();
        });

        it('returns an express router', () => {
            let router = controller.requestHandler();
            router.should.equal(stubRouter);
        });

        it('sets the express router to this.router', () => {
            controller.requestHandler();
            controller.router.should.equal(stubRouter);
        });

        it('router uses _configure', () => {
            controller.requestHandler();
            controller.use.should.have.been.calledWith(controller._configure);
        });

        it('router uses rejectUnsupportedMethods', () => {
            controller.requestHandler();
            controller.use.should.have.been.calledWith(controller.rejectUnsupportedMethods);
        });

        it('calls middlewareMixins', () => {
            controller.requestHandler();
            controller.middlewareMixins.should.have.been.called;
        });

        it('uses get method for GET requests', () => {
            req.method = 'GET';
            controller.requestHandler();
            controller.useWithMethod.should.have.been.calledWithExactly('get', controller.get);
        });

        it('uses post method for POST requests', () => {
            req.method = 'POST';
            controller.requestHandler();
            controller.useWithMethod.should.have.been.calledWithExactly('post', controller.post);
        });

        it('uses errorHandler', () =>  {
            req.method = 'PUT';
            controller.requestHandler();
            controller.use.should.have.been.calledWithExactly(controller.errorHandler);
        });

    });

    describe('rejectUnsupportedMethods', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            controller.methodNotSupported = sinon.stub();
        });

        it('calls methodNotSupported for unsupported methods', () =>  {
            req.method = 'PUT';
            controller.rejectUnsupportedMethods(req, res, next);
            controller.methodNotSupported.should.have.been.calledWithExactly(req, res, next);
            next.should.not.have.been.called;
        });

        it('calls methodNotSupported for POSTing to a skip step', () =>  {
            req.form.options.skip = true;
            req.method = 'POST';
            controller.rejectUnsupportedMethods(req, res, next);
            controller.methodNotSupported.should.have.been.calledWithExactly(req, res, next);
            next.should.not.have.been.called;
        });

        it('does not call methodNotSupported for supported methods', () =>  {
            req.method = 'POST';
            controller.rejectUnsupportedMethods(req, res, next);
            controller.methodNotSupported.should.not.have.been.called;
            next.should.have.been.calledWithExactly();
        });
    });

    describe('get', () => {
        let controller, stubRouter, boundFunctions;

        beforeEach(() => {
            boundFunctions = sinon.stub().yields();
            controller = new Controller(options);
            sinon.stub(controller, '_bindFunctions').returns(boundFunctions);
            stubRouter = sinon.stub();
            stubRouter.use = sinon.stub();
            sinon.stub(express, 'Router').returns(stubRouter);
        });

        afterEach(() => {
            express.Router.restore();
        });

        it('creates an express router', () => {
            controller.get(req, res, next);
            express.Router.should.have.been.calledWithExactly({ mergeParams: true });
        });

        it('binds get lifecycle methods to the controller', () => {
            controller.get(req, res, next);
            controller._bindFunctions.should.have.been.calledWithExactly([
                controller._getErrors,
                controller._getValues,
                controller._locals,
                controller._checkStatus,
                controller.render
            ]);
        });

        it('uses the bound lifecycle methods with the created router', () => {
            controller.get(req, res, next);
            stubRouter.use.should.have.been.calledWithExactly(boundFunctions);
        });

        it('calls the router handler', () => {
            controller.get(req, res, next);
            stubRouter.should.have.been.called.and.calledWith(req, res, next);
        });
    });

    describe('post', () => {
        let controller, stubRouter, boundFunctions;

        beforeEach(() => {
            boundFunctions = sinon.stub().yields();
            controller = new Controller(options);
            sinon.stub(controller, '_bindFunctions').returns(boundFunctions);
            stubRouter = sinon.stub();
            stubRouter.use = sinon.stub();
            sinon.stub(express, 'Router').returns(stubRouter);
        });

        afterEach(() => {
            express.Router.restore();
        });

        it('creates an express router', () => {
            controller.post(req, res, next);
            express.Router.should.have.been.calledWithExactly({ mergeParams: true });
        });

        it('binds get lifecycle methods to the controller', () => {
            controller.post(req, res, next);
            controller._bindFunctions.should.have.been.calledWithExactly([
                controller._resetErrors,
                controller._process,
                controller._validate,
                controller.saveValues,
                controller.successHandler
            ]);
        });

        it('uses the bound lifecycle methods with the created router', () => {
            controller.post(req, res, next);
            stubRouter.use.should.have.been.calledWithExactly(boundFunctions);
        });

        it('calls the router handler', () => {
            controller.post(req, res, next);
            stubRouter.should.have.been.called.and.calledWith(req, res, next);
        });
    });

    describe('methodNotSupported', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
        });

        it('calls next with a 405 error', () => {
            req.method = 'POST';
            controller.methodNotSupported(req, res, next);
            next.should.have.been.called.and.calledWithExactly(sinon.match.instanceOf(Error));
            let err = next.args[0][0];
            err.status.should.equal(405);
            err.code.should.equal('METHOD_NOT_SUPPORTED');
        });

        it('calls next with a 405 error', () => {
            req.method = 'HEAD';
            controller.methodNotSupported(req, res, next);
            next.should.not.have.been.called;
            res.status.should.have.been.calledWithExactly(405);
            res.send.should.have.been.calledWithExactly();
        });
    });

    describe('_configure', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'configure');
        });

        it('creates req.form if it does not already exist', () => {
            delete req.form;
            controller._configure(req, res, next);
            req.form.should.be.an('object');
        });

        it('resolves the current route to its full path', () => {
            controller._configure(req, res, next);
            req.form.options.fullPath.should.equal('/base/route');
        });

        it('deep clones the controller config to req.form.options', () => {
            controller._configure(req, res, next);
            delete req.form.options.fullPath; // except for the added fullPath
            req.form.options.should.deep.equal(controller.options);
            req.form.options.should.not.equal(controller.options);
            req.form.options.fields.should.deep.equal(controller.options.fields);
            req.form.options.fields.should.not.equal(controller.options.fields);
        });

        it('calls the configure method', () => {
            controller._configure(req, res, next);
            controller.configure.should.have.been.calledWithExactly(req, res, next);
        });
    });

    describe('configure', () => {

        it('calls next', () => {
            let controller = new Controller(options);
            controller.configure(req, res, next);
            next.should.have.been.calledWithExactly();
        });
    });


    describe('_getErrors', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'getErrors').returns({ foo: 'bar' });
        });

        it('sets errors from getErrors to req.form.errors', () => {
            controller._getErrors(req, res, next);
            req.form.errors.should.eql({ foo: 'bar' });
        });

        it('calls next', () => {
            controller._getErrors(req, res, next);
            next.should.have.been.calledWithExactly();
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

    describe('_getValues', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'getValues').yields(null, { foo: 'bar' });
        });

        it('sets values from getValues to req.form.values', () => {
            controller._getValues(req, res, next);
            req.form.values.should.eql({ foo: 'bar' });
            next.should.have.been.calledWithExactly(null);
        });

        it('defaults req.form.values to an empty object', () => {
            controller.getValues.yields(null);
            controller._getValues(req, res, next);
            req.form.values.should.eql({});
        });

        it('calls next with any error from getValues', () => {
            let err = new Error();
            controller.getValues.yields(err);
            controller._getValues(req, res, next);
            next.should.have.been.calledWithExactly(err);
        });
    });

    describe('getValues', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
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
            controller.getValues(req, res, callback);
            callback.should.have.been.calledWithExactly(
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
            controller.getValues(req, res, callback);
            callback.should.have.been.calledWithExactly(
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

    describe('_locals', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'getNextStep').returns('/next/step');
            sinon.stub(controller, 'locals').returns({ foo: 'bar' });
        });

        it('adds initial locals to res.locals', () => {
            req.form.errors = { foo: 'bar', boo: 'baz' };
            req.form.values = { a: 1, b: 2 };
            controller._locals(req, res, next);
            res.locals.should.contain({
                options: req.form.options,
                values: req.form.values,
                errors: req.form.errors,
                nextPage: '/next/step',
                action: '/base/route'
            });
            res.locals.errorlist.should.eql(['bar', 'baz']);
        });

        it('filters out grouped field errors', () => {
            req.form.errors = {
                'field-1': { key: 'field-1' },
                'field-2': { key: 'field-2', errorGroup: 'group-1' },
                'field-3': { key: 'field-3', errorGroup: 'group-1' },
                'group-1': { key: 'group-1', errorGroup: 'group-1' },
            };
            controller._locals(req, res, next);
            res.locals.errorlist.should.eql([
                { key: 'field-1' },
                { key: 'group-1', errorGroup: 'group-1' }
            ]);
        });

        it('calls locals as a returning function if it has 2 args', () => {
            controller.locals = (req, res) => ({ foo: 'bar'});
            sinon.spy(controller, 'locals');
            controller._locals(req, res, next);
            controller.locals.should.have.been.calledWithExactly(req, res);
            res.locals.should.contain({ foo: 'bar' });
            next.should.have.been.calledWithExactly();
        });

        it('calls locals as a callback function if it has 3 args', () => {
            controller.locals = (req, res, cb) => cb(null, { foo: 'bar'});
            sinon.spy(controller, 'locals');
            controller._locals(req, res, next);
            controller.locals.should.have.been.calledWithExactly(req, res, sinon.match.func);
            res.locals.should.contain({ foo: 'bar' });
            next.should.have.been.calledWithExactly(null);
        });

        it('calls next with error from locals', () => {
            let err = new Error();
            controller.locals.yields(err);
            controller._locals(req, res, next);
            next.should.have.been.calledWithExactly(err);
        });
    });

    describe('locals', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
        });

        it('calls callback with empty locals object if supplied a callback', () => {
            controller.locals(req, res, callback);
            callback.should.have.been.calledWithExactly(null, {});
        });

        it('returns empty object', () => {
            controller.locals(req, res).should.eql({});
        });
    });

    describe('_checkStatus', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'post');
            sinon.stub(controller, 'setStepComplete');
            sinon.stub(controller, 'successHandler');
        });

        it('should call post if skip is true', () => {
            options.skip = true;
            controller._checkStatus(req, res, next);
            next.should.not.have.been.called;
            controller.post.should.have.been.calledWithExactly(req, res, next);
        });

        it('should call the next callback if skip is not set', () => {
            controller._checkStatus(req, res, next);
            controller.post.should.not.have.been.called;
            next.should.have.been.calledWithExactly();
        });

        it('should call the successHandler if skip is set but there is no post method', () => {
            options.skip = true;
            controller.post = null;
            controller._checkStatus(req, res, next);
            next.should.not.have.been.called;
            controller.successHandler.should.have.been.calledWithExactly(req, res, next);
        });

        it('should call setStepComplete if the step has a next page and no post method', () => {
            res.locals.nextPage = '/next/page';
            controller.post = null;
            controller._checkStatus(req, res, next);
            controller.setStepComplete.should.have.been.calledOnce;
            controller.setStepComplete.should.have.been.calledWithExactly(req, res);
            next.should.have.been.calledWithExactly();
        });

        it('should not call setStepComplete if the next page is the same as the current url', () => {
            res.locals.nextPage = '/base/route';
            controller.post = null;
            controller._checkStatus(req, res, next);
            controller.setStepComplete.should.not.have.been.called;
            next.should.have.been.calledWithExactly();
        });
    });

    describe('render', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
        });

        it('renders the supplied step template', () => {
            controller.render(req, res, next);
            res.render.should.have.been.calledWithExactly('template');
            next.should.not.have.been.called;
        });

        it('calls next with error if no template is supplied', () => {
            delete options.template;
            controller.render(req, res, next);
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
            res.render.should.not.have.been.called;
        });
    });

    describe('_resetErrors', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'setErrors');
        });

        it('sets errors to be null', () => {
            controller._resetErrors(req, res, next);
            controller.setErrors.should.have.been.calledWithExactly(null, req, res);
        });

        it('calls next', () => {
            controller._resetErrors(req, res, next);
            next.should.have.been.calledWithExactly();
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

    describe('_process', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            req.method = 'POST';
            options.fields = {
                field: { formatter: 'uppercase', validate: 'required' },
                name: {},
                bool: { formatter: 'boolean' }
            };
            req.body = {
                field: 'value',
                name: 'Joe Smith',
                bool: 'true'
            };
        });

        it('writes field values to req.form.values', () => {
            controller._process(req, res, next);
            req.form.values.should.have.keys([
                'field',
                'name',
                'bool'
            ]);
        });

        it('formats fields according to the field config', () => {
            controller._process(req, res, next);
            req.form.values.should.eql({
                'field': 'VALUE',
                'name': 'Joe Smith',
                'bool': true
            });
        });

        it('formats fields using context', () => {
            controller.options.fields.field = {
                formatter: function (value) { return value + ' context ' + this.values.name; }
            };
            controller._process(req, res, next);
            req.form.values.should.eql({
                'field': 'value context Joe Smith',
                'name': 'Joe Smith',
                'bool': true
            });
        });

        it('ignores an unknown formatter', () => {
            controller.options.fields = {
                field: { formatter: 'unknown' }
            };
            controller._process(req, res, next);
            next.should.have.been.calledWithExactly();
        });

        it('applies default formatters to values', () => {
            controller.options.fields = {
                field: {}
            };
            req.body.field = 'Hello --  World';
            controller._process(req, res, next);
            req.form.values.field.should.equal('Hello - World');
        });

        it('applies formatter to array of values', () => {
            controller.options.fields = {
                field: { formatter: 'uppercase', multiple: true }
            };
            req.body.field = ['value', 'another value'];
            controller._process(req, res, next);
            req.form.values.field.should.eql(['VALUE', 'ANOTHER VALUE']);
        });

        it('applies formatter function to array of values', () => {
            options.fields = {
                field: { formatter: value => value.toUpperCase(), multiple: true }
            };
            req.body.field = ['value', 'another value'];
            controller._process(req, res, next);
            req.form.values.field.should.eql(['VALUE', 'ANOTHER VALUE']);
        });

        it('applies formatters to an empty value to fields disabled by dependent', () => {
            options.fields = {
                'field-1': { formatter: 'boolean' },
                'field-2': { dependent: 'field-1', formatter: 'boolean' },
                'field-3': { dependent: 'field-1', formatter: 'uppercase' }
            };
            req.body = {
                'field-1': 'false',
                'field-2': 'true',
                'field-3': 'value',
            };
            controller._process(req, res, next);
            expect(req.form.values['field-2']).to.be.undefined; // boolean formatting of '' is undefined
            req.form.values['field-3'].should.equal('');
        });

        it('applies formatters to an body value to fields enabld by dependent', () => {
            options.fields = {
                'field-1': { formatter: 'boolean' },
                'field-2': { dependent: 'field-1', formatter: 'boolean' },
                'field-3': { dependent: 'field-1', formatter: 'uppercase' }
            };
            req.body = {
                'field-1': 'true',
                'field-2': 'true',
                'field-3': 'value',
            };
            controller._process(req, res, next);
            req.form.values['field-2'].should.eql(true);
            req.form.values['field-3'].should.equal('VALUE');
        });

    });

    describe('process', () => {
        it('calls the next callback', () => {
            let controller = new Controller(options);
            controller.validate(req, res, next);
            next.should.have.been.calledWithExactly();
        });
    });

    describe('_validate', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'validateFields').yields({});
            sinon.stub(controller, 'validate');
        });

        it('calls validateFields', () => {
            controller._validate(req, res, next);
            controller.validateFields.should.have.been.calledWithExactly(req, res, sinon.match.func);
        });

        it('calls validate if there were no errors', () => {
            controller._validate(req, res, next);
            controller.validate.should.have.been.calledOnce;
            controller.validate.should.have.been.calledWithExactly(req, res, next);
            next.should.not.have.been.called;
        });

        it('calls next with errors if there were errors from validateFields', () => {
            let errors = {
                'field-1': 'error'
            };
            controller.validateFields.yields(errors);
            controller._validate(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly(errors);
            controller.validate.should.not.have.been.called;
        });
    });

    describe('validateFields', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'validateField').returns(undefined);
            req.form.values = {
                'field-1': 'value 1',
                'field-2': 'value 2'
            };
        });

        it('calls validateField for each field value', () => {
            controller.validateFields(req, res, callback);
            controller.validateField.should.have.been.calledTwice;
            controller.validateField.should.have.been.calledWithExactly('field-1', req, res);
            controller.validateField.should.have.been.calledWithExactly('field-2', req, res);
        });

        it('calls callback with an empty object if there were no errors', () => {
            controller.validateFields(req, res, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWithExactly({});
        });

        it('calls callback with an error instances if an error is returned', () => {
            controller.validateField.withArgs('field-1').returns({ key: 'error-1' });
            controller.validateField.withArgs('field-2').returns({ key: 'error-2' });
            controller.validateFields(req, res, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWithExactly({
                'error-1': sinon.match.instanceOf(controller.Error),
                'error-2': sinon.match.instanceOf(controller.Error)
            });
            callback.args[0][0]['error-1'].key.should.equal('error-1');
            callback.args[0][0]['error-2'].key.should.equal('error-2');
        });

        it('additionaly indexes the errors by errorGroup if a errorGroup is returned from validateField', () => {
            controller.validateField.withArgs('field-1').returns({ key: 'error-1', errorGroup: 'group-1' });
            controller.validateField.withArgs('field-2').returns({ key: 'error-2', errorGroup: 'group-2' });
            controller.validateFields(req, res, callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWithExactly({
                'error-1': sinon.match.instanceOf(controller.Error),
                'error-2': sinon.match.instanceOf(controller.Error),
                'group-1': sinon.match.instanceOf(controller.Error),
                'group-2': sinon.match.instanceOf(controller.Error)
            });
            callback.args[0][0]['error-1'].key.should.equal('error-1');
            callback.args[0][0]['error-2'].key.should.equal('error-2');
            callback.args[0][0]['group-1'].key.should.equal('error-1');
            callback.args[0][0]['group-2'].key.should.equal('error-2');
        });
    });

    describe('validateField', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(validation, 'isAllowedDependent').returns(false);
            sinon.stub(validation, 'validate').returns(true);
            req.form.values = {
                'field': 'value'
            };
        });

        afterEach(() => {
            validation.isAllowedDependent.restore();
            validation.validate.restore();
        });

        it('calls checks if the field needs to be validated', () => {
            controller.validateField('field', req, res);
            validation.isAllowedDependent.should.have.been.calledWithExactly(
                req.form.options.fields,
                'field',
                req.form.values
            );
        });

        it('should not validate the field if the isAllowedDependent returns false', () => {
            validation.isAllowedDependent.returns(false);
            let result = controller.validateField('field', req, res);
            validation.validate.should.not.have.been.called;
            expect(result).to.be.undefined;
        });

        it('should validate the field if the isAllowedDependent returns true', () => {
            validation.isAllowedDependent.returns(true);
            validation.validate.returns(true);
            controller.validateField('field', req, res);
            validation.validate.should.have.been.calledWithExactly(
                req.form.options.fields,
                'field',
                'value',
                {
                    sessionModel: req.sessionModel,
                    values: req.form.values,
                    fields: req.form.options.fields
                }
            );
        });

        it('should return the validation result', () => {
            validation.isAllowedDependent.returns(true);
            validation.validate.returns(true);
            let result = controller.validateField('field', req, res);
            result.should.equal(true);

            validation.validate.returns(false);
            result = controller.validateField('field', req, res);
            result.should.equal(false);
        });
    });

    describe('validate', () => {
        it('calls the next callback', () => {
            let controller = new Controller(options);
            controller.validate(req, res, next);
            next.should.have.been.calledWithExactly();
        });
    });

    describe('saveValues', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
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
            controller.saveValues(req, res, next);
            req.sessionModel.toJSON().should.deep.equal({
                field1: 'field 1 value',
                field2: 'bar',
                field3: 'boo',
                field4: 'field 4 value'
            });
        });

        it('unsets errorValues', () => {
            controller.saveValues(req, res, next);
            expect(req.sessionModel.get('errorValues')).to.be.undefined;
        });

        it('calls next', () => {
            controller.saveValues(req, res, next);
            next.should.have.been.calledWithExactly();
        });
    });

    describe('successHandler', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
            sinon.stub(controller, 'setStepComplete');
            sinon.stub(controller, 'getNextStep').returns('/next/step');
        });

        it('should call setStepComplete', () => {
            controller.successHandler(req, res, next);
            controller.setStepComplete.should.have.been.calledOnce;
            controller.setStepComplete.should.have.been.calledWithExactly(req, res);
        });

        it('should redirect to the next step', () => {
            controller.successHandler(req, res, next);
            controller.getNextStep.should.have.been.calledOnce;
            controller.getNextStep.should.have.been.calledWithExactly(req, res);
            res.redirect.should.have.been.calledWithExactly('/next/step');
        });

        it('should keep the search query if the option is set', () => {
            req.form.options.forwardQuery = true;
            controller.successHandler(req, res, next);
            res.redirect.should.have.been.calledWithExactly('/next/step?this=is&a=query');
        });

        it('should not alter the redirect the search query if the option is set but there is no query', () => {
            req.form.options.forwardQuery = true;
            req.originalUrl = '/original/url';
            controller.successHandler(req, res, next);
            res.redirect.should.have.been.calledWithExactly('/next/step');
        });

    });

    describe('isValidationError', () => {
        let controller;

        beforeEach(() => {
            controller = new Controller(options);
        });

        it('returns false if there are no errors', () => {
            controller.isValidationError().should.equal(false);
            controller.isValidationError({}).should.equal(false);
        });

        it('returns false if not all the errors are validation errors', () => {
            let errors = {
                'error-1': new Error(),
                'error-2': new controller.Error()
            };
            let result = controller.isValidationError(errors);
            result.should.equal(false);
        });

        it('returns true if all the errors are validation errors', () => {
            let errors = {
                'error-1': new controller.Error(),
                'error-2': new controller.Error()
            };
            let result = controller.isValidationError(errors);
            result.should.equal(true);
        });
    });

    describe('errorHandler', () => {
        let controller, err;

        beforeEach(() => {
            err = new Error();
            controller = new Controller(options);
            sinon.stub(controller, 'isValidationError').returns(true);
            sinon.stub(controller, 'setErrors');
            sinon.stub(controller, 'getErrorStep').returns('/error/step');
        });

        it('should redirect to error step if is validation error', () => {
            controller.errorHandler(err, req, res, next);
            next.should.not.have.been.called;
            res.redirect.should.have.been.calledWithExactly('/error/step');
        });

        it('should call setErrors and call next if is validation error and skip is true', () => {
            options.skip = true;
            controller.errorHandler(err, req, res, next);
            controller.setErrors.should.have.been.calledWithExactly(err, req, res);
            next.should.have.been.calledWithExactly(err);
        });

        it('should call next with error if not a validation error', () => {
            controller.isValidationError.returns(false);
            controller.errorHandler(err, req, res, next);
            next.should.have.been.calledWithExactly(err);
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
            'invalidate-journey',
            'invalidate-fields',
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
