'use strict';

const Controller = require('../../lib/controller');

describe('Controller Lifecycle', () => {

    let req, res, next, assert, options, controller, handler, middleware;

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
            originalUrl: '/base/route',
            url: '/route',
            baseUrl: '/base',
            path: '/route',
            form: { options },
        });
        res = response();

        assert = () => { throw 'assert helper not set'; };
        let callsAssert = () => setImmediate(assert);
        next = sinon.stub().callsFake(callsAssert);
        res.render = sinon.stub().callsFake(callsAssert);
        res.redirect = sinon.stub().callsFake(callsAssert);

        controller = new Controller(options);

        sinon.spy(controller, '_configure');
        sinon.spy(controller, 'configure');
        sinon.spy(controller, 'rejectUnsupportedMethods');
        middleware = sinon.stub().yields();
        controller.middlewareMixins = function () {
            this.use(middleware);
        };
        sinon.spy(controller, 'get');
        sinon.spy(controller, 'post');
        sinon.spy(controller, 'errorHandler');
        sinon.spy(controller, 'successHandler');
        sinon.spy(controller, 'setStepComplete');

        handler = controller.requestHandler();
    });

    describe('All requests', () => {
        it('calls _configure', done => {
            assert = () => {
                controller._configure.should.have.been
                    .calledOnce
                    .calledOn(controller)
                    .calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls configure', done => {
            assert = () => {
                controller.configure.should.have.been
                    .calledOnce
                    .calledAfter(controller._configure)
                    .calledOn(controller)
                    .calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls rejectUnsupportedMethods', done => {
            assert = () => {
                controller.rejectUnsupportedMethods.should.have.been
                    .calledOnce
                    .calledAfter(controller.configure)
                    .calledOn(controller)
                    .calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls middleware mixins', done => {
            assert = () => {
                middleware.should.have.been
                    .calledOnce
                    .calledAfter(controller.rejectUnsupportedMethods)
                    .calledOn(controller)
                    .calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });


        it('calls get for a GET request', done => {
            assert = () => {
                controller.get.should.have.been
                    .calledOnce
                    .calledAfter(middleware)
                    .calledOn(controller)
                    .calledWithExactly(req, res, sinon.match.func);
                controller.post.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('calls post for a POST request', done => {
            req.method = 'POST';
            assert = () => {
                controller.post.should.have.been
                    .calledOnce
                    .calledAfter(middleware)
                    .calledOn(controller)
                    .calledWithExactly(req, res, sinon.match.func);
                controller.get.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('does not call the error handler if there was no error', done => {
            assert = () => {
                controller.errorHandler.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('calls errorHandler if a lifecycle method responds with an error', done => {
            let error = new Error();
            middleware = sinon.stub().yields(error);
            handler = controller.requestHandler();

            assert = () => {
                controller.errorHandler.should.have.been
                    .calledOnce
                    .calledOn(controller)
                    .calledWithExactly(error, req, res, sinon.match.func);
                next.should.have.been.calledWithExactly(error);
                done();
            };

            handler(req, res, next);
        });

        it('keeps url params from parent routers', done => {
            let router = require('express').Router();
            router.route('/test/:id').all(handler);

            req.method = 'GET';
            req.url = '/test/123';

            assert = () => {
                let middlewareReq = middleware.args[0][0];
                middlewareReq.params.id.should.equal('123');
                done();
            };

            router(req, res, next);
        });

        it('returns a 405 error on unsupported methods', done =>  {
            req.method = 'PUT';
            assert = () => {
                next.should.have.been.called;
                let err = next.args[0][0];
                err.should.be.instanceOf(Error);
                err.status.should.equal(405);
                done();
            };

            handler(req, res, next);
        });
    });

    describe('GET requests', () => {
        beforeEach(() => {
            sinon.spy(controller, '_getErrors');
            sinon.spy(controller, 'getErrors');
            sinon.spy(controller, '_getValues');
            sinon.spy(controller, 'getValues');
            sinon.spy(controller, '_locals');
            sinon.spy(controller, 'locals');
            sinon.spy(controller, '_checkStatus');
            sinon.spy(controller, 'render');
        });

        it('calls _getErrors and getErrors', done => {
            assert = () => {
                controller._getErrors.should.have.been
                    .calledOnce
                    .calledAfter(controller.get)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.getErrors.should.have.been
                    .calledOnce
                    .calledAfter(controller._getErrors)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res);
                done();
            };

            handler(req, res, next);
        });

        it('calls _getValues and getvalues', done => {
            assert = () => {
                controller._getValues.should.have.been
                    .calledOnce
                    .calledAfter(controller._getErrors)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.getValues.should.have.been
                    .calledOnce
                    .calledAfter(controller._getValues)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls _locals and locals', done => {
            assert = () => {
                controller._locals.should.have.been
                    .calledOnce
                    .calledAfter(controller._getValues)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.locals.should.have.been
                    .calledOnce
                    .calledAfter(controller._locals)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls _checkStatus', done => {
            assert = () => {
                controller._checkStatus.should.have.been
                    .calledOnce
                    .calledAfter(controller._locals)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls render', done => {
            assert = () => {
                controller.render.should.have.been
                    .calledOnce
                    .calledAfter(controller._checkStatus)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.setStepComplete.should.not.have.been.called;
                controller.successHandler.should.not.have.been.called;
                controller.post.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('calls the post method if the skip option is set', done => {
            controller.options.skip = true;

            assert = () => {
                controller.post.should.have.been
                    .calledOnce
                    .calledAfter(controller._checkStatus)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.render.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('runs the successHandler if the skip options is set and there is no post handler', done => {
            controller.options.skip = true;
            controller.post = null;

            assert = () => {
                controller.successHandler.should.have.been
                    .calledOnce
                    .calledAfter(controller._checkStatus)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.setStepComplete.should.have.been
                    .calledOnce
                    .calledAfter(controller.successHandler)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res);
                controller.render.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('sets the step as complete if there is no post handler', done => {
            controller.post = null;

            assert = () => {
                controller.setStepComplete.should.have.been
                    .calledOnce
                    .calledAfter(controller._checkStatus)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res);
                controller.render.should.have.been
                    .calledOnce
                    .calledAfter(controller.setStepComplete)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.successHandler.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('does not set the step as complete if there is no next page', done => {
            controller.post = null;
            delete controller.options.next;

            assert = () => {
                controller.render.should.have.been
                    .calledOnce
                    .calledAfter(controller._checkStatus)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.setStepComplete.should.not.have.been.called;
                controller.successHandler.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

        it('does not set the step as complete if checkJourney is disabled', done => {
            options.checkJourney = false;

            assert = () => {
                controller.render.should.have.been
                    .calledOnce
                    .calledAfter(controller._checkStatus)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.setStepComplete.should.not.have.been.called;
                controller.successHandler.should.not.have.been.called;
                done();
            };

            handler(req, res, next);
        });

    });

    describe('POST request', () =>{
        beforeEach(() => {
            req.method = 'POST';
            sinon.spy(controller, '_resetErrors');
            sinon.spy(controller, 'setErrors');
            sinon.spy(controller, '_process');
            sinon.spy(controller, 'process');
            sinon.spy(controller, '_validate');
            sinon.spy(controller, 'validate');
            sinon.spy(controller, 'saveValues');
        });

        it('calls _resetErrors', done => {
            assert = () => {
                controller._resetErrors.should.have.been
                    .calledOnce
                    .calledAfter(controller.post)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.setErrors.should.have.been
                    .calledOnce
                    .calledAfter(controller._resetErrors)
                    .and.calledOn(controller)
                    .and.calledWithExactly(null, req, res);
                done();
            };

            handler(req, res, next);
        });

        it('calls _process and process', done => {
            assert = () => {
                controller._process.should.have.been
                    .calledOnce
                    .calledAfter(controller._resetErrors)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.process.should.have.been
                    .calledOnce
                    .calledAfter(controller._process)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls _validate and validate', done => {
            assert = () => {
                controller._validate.should.have.been
                    .calledOnce
                    .calledAfter(controller.process)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.validate.should.have.been
                    .calledOnce
                    .calledAfter(controller._validate)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('does not call validate if _validate fails', done => {
            controller.validateField = sinon.stub().returns({ key: 'test' });
            assert = () => {
                controller._validate.should.have.been
                    .calledOnce
                    .calledAfter(controller.process)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.validate.should.not.have.been.called;
                controller.errorHandler.should.have.been
                    .calledOnce
                    .calledAfter(controller._validate)
                    .and.calledOn(controller)
                    .and.calledWithExactly({ test: sinon.match.instanceOf(controller.Error) }, req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls saveValues', done => {
            assert = () => {
                controller.saveValues.should.have.been
                    .calledOnce
                    .calledAfter(controller.validate)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                done();
            };

            handler(req, res, next);
        });

        it('calls successHandler', done => {
            assert = () => {
                controller.successHandler.should.have.been
                    .calledOnce
                    .calledAfter(controller.saveValues)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.setStepComplete.should.have.been
                    .calledOnce
                    .calledAfter(controller.successHandler)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res);
                res.redirect.should.have.been
                    .calledOnce
                    .calledAfter(controller.setStepComplete);
                done();
            };

            handler(req, res, next);
        });

        it('successHandler does not set step complete if checkJourney is disabled', done => {
            options.checkJourney = false;
            assert = () => {
                controller.successHandler.should.have.been
                    .calledOnce
                    .calledAfter(controller.saveValues)
                    .and.calledOn(controller)
                    .and.calledWithExactly(req, res, sinon.match.func);
                controller.setStepComplete.should.not.have.been.called;
                res.redirect.should.have.been
                    .calledOnce
                    .calledAfter(controller.successHandler);
                done();
            };

            handler(req, res, next);
        });

    });
});
