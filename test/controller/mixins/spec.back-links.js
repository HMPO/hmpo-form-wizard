'use strict';

const baseController = require('../../helpers/controller');
const backLinks = require('../../../lib/controller/mixins/back-links');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');

describe('mixins/back-links', () => {
    let BaseController, StubController;
    let req, res, next, controller, steps;

    beforeEach(() => {

        steps = {
            '/step1': {
                next: '/step2'
            },
            '/step2': {
                next: '/step3'
            },
            '/step3': {
                next: '/step4'
            },
            '/step3a': {
                next: '/step4'
            },
            '/step4': {
                next: '/step5'
            },
            '/step5': {}
        };

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = backLinks(BaseController);
        controller = new StubController({
            route: '/',
            steps
        });

        req = request({
            method: 'GET'
        });
        res = {
            locals: {}
        };
        next = sinon.stub();
    });

    it('should export a function', () => {
        backLinks.should.be.a.function;
        backLinks.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareLocals override', () => {
        it('calls the super method', () => {
            controller.middlewareLocals();
            BaseController.prototype.middlewareLocals.should.have.been.calledOnce;
        });

        it('uses the backlinksSetLocals middleware', () => {
            controller.middlewareLocals();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.backlinksSetLocals
            );
        });
    });

    describe('backlinksSetLocals middleware', () => {

        it('calls the next callback', () => {
            controller.backlinksSetLocals(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('is not set on a POST request', () => {
            req.method = 'POST';
            req.sessionModel.set('steps', ['/step1']);
            controller.options.route = '/step2';
            controller.backlinksSetLocals(req, res, next);
            expect(res.locals.isBackLink).to.be.undefined;
            expect(res.locals.backLink).to.be.undefined;
        });

        it('is only set on a GET request', () => {
            req.method = 'GET';
            req.sessionModel.set('steps', ['/step1']);
            controller.options.route = '/step2';
            controller.backlinksSetLocals(req, res, next);
            expect(res.locals.isBackLink).to.not.be.undefined;
            expect(res.locals.backLink).to.not.be.undefined;
        });

        it('adds the previous step to res.locals.backLink', () => {
            req.get.withArgs('referrer').returns('http://example.com/referrer/step2');
            req.baseUrl = '/referrer';
            req.sessionModel.set('steps', ['/step1']);
            controller.options.route = '/step2';
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/referrer/step1');
        });

        it('is not defined for first step of journey', () => {
            controller.backlinksSetLocals(req, res, next);
            expect(res.locals.backLink).to.be.undefined;
        });

        it('adds the most recently visited previous step if there are multiple options', () => {
            req.get.withArgs('referrer').returns('http://example.com/referrer');
            req.baseUrl = '/referrer';
            req.sessionModel.set('steps', ['/step1', '/step3', '/step3a']);
            controller.options.route = '/step4';
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/referrer/step3a');

            req.sessionModel.set('steps', ['/step1', '/step3a', '/step3']);
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/referrer/step3');
        });

        it('uses configured backLink property if it exists', () => {
            req.baseUrl = '/base';
            controller.options.backLink = '/back';
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/back');
        });

        it('resolves relative backlink to absolute backlink', () => {
            req.baseUrl = '/base';
            controller.options.backLink = 'back';
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/base/back');
        });

        it('sets backLink to falsy value if it is configured', () => {
            controller.options.backLink = null;
            controller.backlinksSetLocals(req, res, next);
            expect(res.locals.backLink).to.be.null;
        });

        it('strips baseUrl before checking whitelist', () => {
            req.get.withArgs('referrer').returns('http://example.com/base/whitelist');
            req.baseUrl = '/base';
            req.sessionModel.set('steps', ['/step1', '/step2']);
            controller.options.backLinks = ['whitelist'];
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/base/whitelist');
        });

        it('supports absolute paths in whitelist', () => {
            req.get.withArgs('referrer').returns('http://example.com/whitelist');
            req.baseUrl = '/base';
            req.sessionModel.set('steps', ['/step1', '/step2']);
            controller.options.backLinks = ['/whitelist'];
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/whitelist');
        });

        it('permits whitelisting of steps in history', () => {
            req.get.withArgs('referrer').returns('http://example.com/base/step4');
            req.baseUrl = '/base';
            req.sessionModel.set('steps', ['/step1', '/step2', '/step3a', '/step4']);
            controller.options.backLinks = ['step2'];
            controller.options.route = '/step3';
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/base/step2');
        });

        it('returns most recent of whitelisted steps in history', () => {
            req.get.withArgs('referrer').returns('http://example.com/base/step4');
            req.baseUrl = '/base';
            req.sessionModel.set('steps', ['/step1', '/step2', '/step3', '/step4']);
            controller.options.backLinks = ['step2', 'step1'];
            controller.options.route = 'step3';
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/base/step2');
        });

        it('returns undefined if referrer header is not on whitelist', () => {
            req.get.withArgs('referrer').returns('http://example.com/not-whitelisted');
            controller.options.route = '/step3';
            req.sessionModel.set('steps', ['/step1', '/step2']);
            controller.options.backLinks = ['whitelist'];
            controller.backlinksSetLocals(req, res, next);
            expect(res.locals.backLink).to.be.undefined;
        });

        it('returns undefined if referrer header not present', () => {
            controller.options.route = '/step3';
            req.sessionModel.set('steps', ['/step1', '/step2']);
            controller.options.backLinks = ['whitelist'];
            controller.backlinksSetLocals(req, res, next);
            expect(res.locals.backLink).to.be.undefined;
        });

        describe('isBackLink request object property', () => {

            it('is false when the last step is before the current page', () => {
                req.sessionModel.set('steps', ['/step1', '/step2']);
                controller.options.route = '/step3';
                controller.backlinksSetLocals(req, res, next);
                req.isBackLink.should.not.be.ok;
                res.locals.isBackLink.should.not.be.ok;
            });

            it('is true when the last step matches the page path', () => {
                req.sessionModel.set('steps', ['/step1', '/step2']);
                controller.options.route = '/step2';
                controller.backlinksSetLocals(req, res, next);
                req.isBackLink.should.be.ok;
                res.locals.isBackLink.should.be.ok;
            });

            it('is true when the last step matches the next path', () => {
                req.sessionModel.set('steps', ['/step1', '/step2']);
                controller.options.next = '/step2';
                controller.options.route = '/step1';
                controller.backlinksSetLocals(req, res, next);
                req.isBackLink.should.be.ok;
                res.locals.isBackLink.should.be.ok;
            });

        });
    });
});
