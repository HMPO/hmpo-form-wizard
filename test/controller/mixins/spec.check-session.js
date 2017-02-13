'use strict';

const baseController = require('../../helpers/controller');
const checkSession = require('../../../lib/controller/mixins/check-session');

describe('mixins/check-session', () => {
    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        let options = {
            checkSession: true,
            route: '/route'
        };

        req = request({
            form: { options },
            path: '/test',
            method: 'GET',
            cookies: {
                'hmpo-wizard-sc': 1
            }
        });
        res = response();
        res = {
            cookie: sinon.stub()
        };
        next = sinon.stub();

        BaseController = baseController();
        StubController = checkSession(BaseController);
        controller = new StubController(options);
    });

    it('should export a function', () => {
        checkSession.should.be.a.function;
        checkSession.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareChecks override', () => {
        it('calls the super method', () => {
            controller.middlewareChecks();
            BaseController.prototype.middlewareChecks.should.have.been.calledOnce;
        });

        it('uses the checkSession middleware', () => {
            controller.middlewareChecks();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.checkSession
            );
        });
    });

    describe('checkSession middleware', () => {

        it('throws session error if cookie exists, but session flag does not', () => {
            controller.checkSession(req, res, next);
            next.should.have.been.calledOnce;
            next.args[0][0].should.be.an.instanceOf(Error);
            next.args[0][0].code.should.equal('SESSION_TIMEOUT');
        });

        it('does not throw session error if cookie exists and session flag exists', () => {
            req.session.exists = true;
            controller.checkSession(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('does not throw session error if cookie does not exist', () => {
            req.cookies = {};
            controller.checkSession(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('does not throw error on GET to first route', () => {
            controller.options.entryPoint = true;
            controller.checkSession(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('throws session error on POST to first route', () => {
            req.method = 'POST';
            controller.options.entryPoint = true;
            controller.checkSession(req, res, next);
            next.should.have.been.calledOnce;
            next.args[0][0].should.be.an.instanceOf(Error);
            next.args[0][0].code.should.equal('SESSION_TIMEOUT');
        });

        it('does not throw session error if controller checkSession option is false', () => {
            controller.options.checkSession = false;
            controller.checkSession(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('sets the session check cookie', () => {
            req.cookies = {};
            controller.checkSession(req, res, next);
            res.cookie.should.have.been.calledOnce;
            res.cookie.should.have.been.calledWithExactly('hmpo-wizard-sc', 1);
        });

        it('sets the session flag', () => {
            req.cookies = {};
            req.session.exists = false;
            controller.checkSession(req, res, next);
            req.session.exists.should.be.ok;
        });
    });

});
