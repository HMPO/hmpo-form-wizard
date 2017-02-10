'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const invalidateJourney = require('../../../lib/controller/mixins/invalidate-journey');

describe('mixins/invalidate-journey', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        let options = {
            route: '/one'
        };

        req = request({
            form: { options },
            baseUrl: '/'
        });
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = invalidateJourney(BaseController);
        controller = new StubController(options);

        req.journeyModel.set('history', [
            { path: '/one' },
            { path: '/two', fields: [ 'field1', 'field2' ] },
            { path: '/three' },
            { path: '/four', fields: [ 'field2' ] },
        ]);
    });

    it('should export a function', () => {
        invalidateJourney.should.be.a.function;
        invalidateJourney.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareChecks override', () => {
        it('calls the super method', () => {
            controller.middlewareChecks();
            BaseController.prototype.middlewareChecks.should.have.been.calledOnce;
        });

        it('uses the checkJourneyInvalidations middleware', () => {
            controller.middlewareChecks();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.checkJourneyInvalidations
            );
        });
    });

    describe('checkJourneyInvalidations', () => {
        it('adds a changes event to the session model', () => {
            controller._invalidateJourney = sinon.stub();
            controller.checkJourneyInvalidations(req, res, next);
            req.sessionModel.set({ a: 1, b: 2 });
            controller._invalidateJourney.should.have.been.calledOnce;
            controller._invalidateJourney.should.have.been.calledWithExactly(
                req,
                res,
                { a: 1, b: 2 }
            );
        });

        it('should call the next callback', () => {
            controller.checkJourneyInvalidations(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });
    });

    describe('_invalidateJourney', () => {
        it('should not change the step history if there are no changes', () => {
            controller._invalidateJourney(req, res, {});
            req.journeyModel.get('history').should.deep.equal([
                { path: '/one' },
                { path: '/two', fields: [ 'field1', 'field2' ] },
                { path: '/three' },
                { path: '/four', fields: [ 'field2' ] },
            ]);
        });

        it('should do nothing if there is no journey history', () => {
            req.journeyModel.unset('history');
            controller._invalidateJourney(req, res, { field4: 'value' });
            expect(req.journeyModel.get('history')).to.be.undefined;
        });

        it('should not change the step history if no matched fields are changed', () => {
            controller._invalidateJourney(req, res, { field4: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { path: '/one' },
                { path: '/two', fields: [ 'field1', 'field2' ] },
                { path: '/three' },
                { path: '/four', fields: [ 'field2' ] },
            ]);
        });

        it('should truncate the step history if a changed field matches', () => {
            controller._invalidateJourney(req, res, { field2: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { path: '/one' }
            ]);
        });

        it('should truncate the step history only after current step', () => {
            controller.options.route = '/three';
            controller._invalidateJourney(req, res, { field2: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { path: '/one' },
                { path: '/two', fields: [ 'field1', 'field2' ] },
                { path: '/three' },
            ]);
        });

        it('should not change the step history if the current step isn\'t in history', () => {
            controller.options.route = '/seven';
            controller._invalidateJourney(req, res, { field4: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { path: '/one' },
                { path: '/two', fields: [ 'field1', 'field2' ] },
                { path: '/three' },
                { path: '/four', fields: [ 'field2' ] },
            ]);
        });

    });

});

