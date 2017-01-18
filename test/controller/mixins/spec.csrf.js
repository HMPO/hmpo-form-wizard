'use strict';

const baseController = require('../../helpers/controller');
const proxyquire = require('proxyquire');

describe('mixins/csrf', () => {
    let BaseController, StubController;
    let req, res, next, controller, csrfStub, csrfMixin;

    beforeEach(() => {
        csrfStub = {
            secret: sinon.stub().yields(null, 'A New Secret'),
            create: sinon.stub().returns('A New Token'),
            verify: sinon.stub().returns(true)
        };
        csrfMixin = proxyquire('../../../lib/controller/mixins/csrf', {
            'csrf': () => csrfStub
        });

        BaseController = baseController();
        StubController = csrfMixin(BaseController);
        controller = new StubController();

        req = request({
            method: 'GET'
        });
        res = {
            locals: {}
        };
        next = sinon.stub();
    });

    it('should export a function', () => {
        csrfMixin.should.be.a.function;
        csrfMixin.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareSetup override', () => {
        it('calls the super method', () => {
            controller.middlewareSetup();
            BaseController.prototype.middlewareSetup.should.have.been.calledOnce;
        });

        it('uses the csrfGenerateSecret middleware', () => {
            controller.middlewareSetup();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.csrfGenerateSecret
            );
        });
    });

    describe('middlewareChecks override', () => {
        it('calls the super method', () => {
            controller.middlewareChecks();
            BaseController.prototype.middlewareChecks.should.have.been.calledOnce;
        });

        it('uses the csrfCheckToken middleware', () => {
            controller.middlewareChecks();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.csrfCheckToken
            );
        });

        it('should not use the csrfCheckToken middleware if disabled in options', () => {
            controller.options.csrf = false;
            controller.middlewareChecks();
            BaseController.prototype.use.should.not.have.been.called;
        });
    });

    describe('middlewareLocals override', () => {
        it('calls the super method', () => {
            controller.middlewareLocals();
            BaseController.prototype.middlewareLocals.should.have.been.calledOnce;
        });

        it('uses the csrfSetToken middleware', () => {
            controller.middlewareLocals();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.csrfSetToken
            );
        });
    });

    describe('csrfGenerateSecret middleware', () => {
        it('creates a csrf secret in the session model if one does not exist', () => {
            controller.csrfGenerateSecret(req, res, next);
            req.sessionModel.get('csrf-secret').should.equal('A New Secret');
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with error from secret generator', () => {
            let err = new Error;
            csrfStub.secret.yields(err);
            controller.csrfGenerateSecret(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly(err);
        });

        it('calls callback immediately if secret already set', () => {
            req.sessionModel.set('csrf-secret', 'Existing Secret');
            controller.csrfGenerateSecret(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
            req.sessionModel.get('csrf-secret').should.equal('Existing Secret');
        });
    });

    describe('csrfCheckToken middleware', () => {
        ['GET', 'HEAD', 'OPTIONS'].forEach(method => {
            it(`accepts ${method} requests without a token`, () => {
                req.method = method;
                controller.csrfCheckToken(req, res, next);
                next.should.have.been.calledOnce;
                next.should.have.been.calledWithExactly();
                csrfStub.verify.should.not.have.been.called;
            });
        });

        ['POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
            it(`validates token in body on ${method} requests`, () => {
                req.method = method;
                req.body['x-csrf-token'] = 'Token';
                req.sessionModel.set('csrf-secret', 'Secret');
                controller.csrfCheckToken(req, res, next);
                csrfStub.verify.should.have.been.calledWithExactly('Secret', 'Token');
                next.should.have.been.calledOnce;
                next.should.have.been.calledWithExactly();
            });

            it(`validates token in header on ${method} requests`, () => {
                req.method = method;
                req.headers['x-csrf-token'] = 'Token';
                req.sessionModel.set('csrf-secret', 'Secret');
                controller.csrfCheckToken(req, res, next);
                csrfStub.verify.should.have.been.calledWithExactly('Secret', 'Token');
                next.should.have.been.calledOnce;
                next.should.have.been.calledWithExactly();
            });

            it(`passes error to callback for invalid token on ${method} requests`, () => {
                req.method = method;
                req.headers['x-csrf-token'] = 'Token';
                req.sessionModel.set('csrf-secret', 'Secret');
                csrfStub.verify.returns(false);
                controller.csrfCheckToken(req, res, next);
                next.should.have.been.calledOnce;
                next.args[0][0].should.be.an.instanceOf(Error);
                next.args[0][0].code.should.equal('CSRF_ERROR');
            });
        });

    });

    describe('csrfSetToken middleware', () => {
        it('generates a token on GET requests', () => {
            req.method = 'GET';
            req.sessionModel.set('csrf-secret', 'Secret');
            controller.csrfSetToken(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
            csrfStub.create.should.have.been.calledOnce;
            csrfStub.create.should.have.been.calledWithExactly('Secret');
            res.locals['csrf-token'].should.equal('A New Token');
        });

        it('should not call csrf.create on POST requests', () => {
            req.method = 'POST';
            req.sessionModel.set('csrf-secret', 'Secret');
            controller.csrfSetToken(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
            csrfStub.create.should.not.have.been.called;
            expect(res.locals['csrf-token']).to.not.be.ok;
        });

    });
});
