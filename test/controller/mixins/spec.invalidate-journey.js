'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const checkProgress = require('../../../lib/controller/mixins/check-progress');
const invalidateJourney = require('../../../lib/controller/mixins/invalidate-journey');

describe('mixins/invalidate-journey', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        let options = {
            name: 'w1',
            route: '/one',
            fullPath: '/one',
            fields: {

            },
            allFields: {}
        };

        req = request({
            form: { options },
            baseUrl: '/'
        });
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        BaseController = checkProgress(BaseController);
        StubController = invalidateJourney(BaseController);
        controller = new StubController(options);

        BaseController.prototype.middlewareChecks = sinon.stub();

        req.journeyModel.set('history', [
            { wizard: 'w1', path: '/one', next: '/two' },
            { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2' ] },
            { wizard: 'w1', path: '/three', next: '/four' },
            { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ] },
        ]);
    });

    it('should export a function', () => {
        invalidateJourney.should.be.a('function');
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
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2' ] },
                { wizard: 'w1', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ] }
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
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2' ] },
                { wizard: 'w1', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ] }
            ]);
        });

        it('should invalidate all steps in history matching a changed field', () => {
            controller._invalidateJourney(req, res, { field2: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2' ], invalid: true },
                { wizard: 'w1', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ], invalid: true }
            ]);
        });

        it('should invalidate a step in history only after current step', () => {
            controller.options.fullPath = '/three';
            controller._invalidateJourney(req, res, { field2: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2' ] },
                { wizard: 'w1', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ], invalid: true }
            ]);
        });

        it('should invalidate all steps in history matching a * after current step', () => {
            controller.options.fullPath = '/two';
            req.journeyModel.set('history', [
                { wizard: 'w1', path: '/one', next: '/two', fields: [ 'field1', 'field2', '*' ] },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2', '*' ] },
                { wizard: 'w2', path: '/three', next: '/four', fields: [ '*' ] },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ] }
            ]);
            controller._invalidateJourney(req, res, { field3: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two', fields: [ 'field1', 'field2', '*' ] },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2', '*' ], invalid: true },
                { wizard: 'w2', path: '/three', next: '/four', fields: [ '*' ], invalid: true },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ] }
            ]);
        });

        it('should invalidate a step that is not part of the flow', () => {
            req.journeyModel.set('history', [
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w1', path: '/unlinked1', next: '/two', fields: [ 'field1' ] },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1' ] },
                { wizard: 'w1', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field1' ] },
                { wizard: 'w1', path: '/unlinked2', next: '/two', fields: [ 'field1' ] },
            ]);
            controller._invalidateJourney(req, res, { field1: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w1', path: '/unlinked1', next: '/two', fields: [ 'field1' ], invalid: true  },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1' ], invalid: true  },
                { wizard: 'w1', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field1' ], invalid: true },
                { wizard: 'w1', path: '/unlinked2', next: '/two', fields: [ 'field1' ], invalid: true  },
            ]);
        });

        it('should not invalidate a step from another wizard', () => {
            req.journeyModel.set('history', [
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w2', path: '/two', next: '/three', fields: [ 'field1', 'field2' ] },
                { wizard: 'w2', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ] }
            ]);
            controller._invalidateJourney(req, res, { field2: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w2', path: '/two', next: '/three', fields: [ 'field1', 'field2' ] },
                { wizard: 'w2', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ], invalid: true }
            ]);
        });

        it('should invalidate a step in history from another wizard using the journeyKey', () => {
            req.journeyModel.set('history', [
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w2', path: '/two', next: '/three', fields: [ 'field1', 'journey2' ] }
            ]);
            req.form.options.allFields = { field2: { journeyKey: 'journey2' }};
            controller._invalidateJourney(req, res, { field2: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w2', path: '/two', next: '/three', fields: [ 'field1', 'journey2' ], invalid: true }
            ]);
        });

        it('should invalidate and revalidate a step if a formField matches', () => {
            req.journeyModel.set('history', [
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w2', path: '/two', next: '/three', formFields: [ 'field1', 'journey2' ] }
            ]);
            req.form.options.allFields = { field2: { journeyKey: 'journey2' }};
            controller._invalidateJourney(req, res, { field2: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w2', path: '/two', next: '/three', formFields: [ 'field1', 'journey2' ], invalid: true, revalidate: true }
            ]);
        });

        it('should not change the step history if the current step isn\'t in history', () => {
            controller.options.fullPath = '/seven';
            controller._invalidateJourney(req, res, { field4: 'value' });
            req.journeyModel.get('history').should.deep.equal([
                { wizard: 'w1', path: '/one', next: '/two' },
                { wizard: 'w1', path: '/two', next: '/three', fields: [ 'field1', 'field2' ] },
                { wizard: 'w1', path: '/three', next: '/four' },
                { wizard: 'w1', path: '/four', next: '/five', fields: [ 'field2' ] }
            ]);
        });

    });

});

