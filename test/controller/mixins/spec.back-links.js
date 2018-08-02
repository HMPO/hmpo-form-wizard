'use strict';

const baseController = require('../../helpers/controller');
const backLinks = require('../../../lib/controller/mixins/back-links');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const checkProgress = require('../../../lib/controller/mixins/check-progress');

describe('mixins/back-links', () => {
    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        BaseController = checkProgress(BaseController);
        StubController = backLinks(BaseController);

        let options = { route: '/' };
        controller = new StubController(options);

        req = request({
            form: { options },
            method: 'GET',
            baseUrl: '/base'
        });
        res = {
            locals: {}
        };
        next = sinon.stub();

        req.journeyModel.set('history', [
            { path: '/base/step1', next: '/base/step2' },
            { path: '/base/step2', next: '/base/step3' },
            { path: '/base/step3', next: '/base/step4' }
        ]);
    });

    it('should export a function', () => {
        backLinks.should.be.a('function');
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
        beforeEach(() => {
            controller.getBackLink = sinon.stub().returns('/back/link');
        });

        it('adds the backlink to res.locals.backLink', () => {
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/back/link');
        });

        it('calls the next callback', () => {
            controller.backlinksSetLocals(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });

    describe('getBackLink', () => {
        it('returns the previous step', () => {
            controller.options.route = '/step2';
            let backLink = controller.getBackLink(req, res);
            backLink.should.equal('/base/step1');
        });

        it('is not defined for first step of journey', () => {
            req.journeyModel.unset('history');
            let backLink = controller.getBackLink(req, res);
            expect(backLink).to.be.undefined;
        });

        it('uses configured backLink property if it exists', () => {
            controller.options.backLink = '/back';
            controller.backlinksSetLocals(req, res, next);
            res.locals.backLink.should.equal('/back');
        });

        it('resolves relative backlink to absolute backlink', () => {
            controller.options.backLink = 'back';
            let backLink = controller.getBackLink(req, res);
            backLink.should.equal('/base/back');
        });

        it('sets backLink to falsey value if it is configured', () => {
            controller.options.backLink = false;
            let backLink = controller.getBackLink(req, res);
            backLink.should.equal(false);
        });

        it('skips history items that are marked as skip', () => {
            req.journeyModel.set('history', [
                { path: '/base/step1', next: '/base/step2' },
                { path: '/base/step2', next: '/base/step3' },
                { path: '/base/step3', next: '/base/step4', skip: true },
                { path: '/base/step4', next: '/base/step5', skip: true },
                { path: '/base/step5', next: '/base/step6' }
            ]);
            controller.options.route = '/step5';
            let backLink = controller.getBackLink(req, res);
            backLink.should.equal('/base/step2');
        });

    });
});
