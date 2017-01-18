'use strict';

const baseController = require('../../helpers/controller');
const checkProgress = require('../../../lib/controller/mixins/check-progress');

describe('mixins/check-progress', () => {

    let BaseController, StubController;
    let req, res, next, controller, steps;

    beforeEach(() => {
        req = request();
        res = response();
        next = sinon.stub();

        steps = {
            '/one': { next: '/two' },
            '/two': { next: '/three' },
            '/three': { next: '/four' },
            '/four': {}
        };

        BaseController = baseController();
        StubController = checkProgress(BaseController);
        controller = new StubController({
            route: '/',
            steps
        });

    });

    it('should export a function', () => {
        checkProgress.should.be.a.function;
        checkProgress.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareChecks override', () => {
        it('calls the super method', () => {
            controller.middlewareChecks();
            BaseController.prototype.middlewareChecks.should.have.been.calledOnce;
        });

        it('hooks setStepComplete to the complete event', () => {
            controller.middlewareChecks();
            BaseController.prototype.on.should.have.been.calledOnce;
            BaseController.prototype.on.should.have.been.calledWithExactly(
                'complete',
                controller.setStepComplete
            );
        });

        it('uses the checkJourneyProgress middleware', () => {
            controller.middlewareChecks();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.checkJourneyProgress
            );
        });
    });

    describe('checkJourneyProgress', () => {
        it('calls callback with no arguments if step has no prereqs', () => {
            controller.options.route = '/one';
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with no arguments if prerequisite steps are complete', () => {
            req.sessionModel.set('steps', [ '/one', '/two' ]);
            controller.options.route = '/three';
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with no arguments if specified prereqs are in steps', () => {
            req.sessionModel.set('steps', [ '/one', '/two' ]);
            controller.options.route = '/four';
            controller.options.prereqs = [ '/two' ];
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('calls callback with MISSING_PREREQ error for steps with no valid prerequisite', () => {
            req.sessionModel.set('steps', []);
            controller.options.route = '/three';
            controller.checkJourneyProgress(req, res, next);
            next.should.have.been.calledOnce;
            next.args[0][0].should.be.an.instanceOf(Error);
            next.args[0][0].code.should.equal('MISSING_PREREQ');
        });
    });

    describe('setStepComplete', () => {
        it('adds first step to history', () => {
            controller.options.route = '/two';
            controller.setStepComplete(req, res);
            req.sessionModel.get('steps').should.deep.equal([
                '/two'
            ]);
        });

        it('appends this step to the step history', () => {
            req.sessionModel.set('steps', [ '/one', '/two' ]);
            controller.options.route = '/three';
            controller.setStepComplete(req, res);
            req.sessionModel.get('steps').should.deep.equal([
                '/one',
                '/two',
                '/three'
            ]);
        });

        it('removes this step from history if it exists before appending it', () => {
            req.sessionModel.set('steps', [ '/one', '/two', '/three' ]);
            controller.options.route = '/two';
            controller.setStepComplete(req, res);
            req.sessionModel.get('steps').should.deep.equal([
                '/one',
                '/three',
                '/two'
            ]);
        });
    });

});

