'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const nextStepMixin = require('../../../lib/controller/mixins/next-step');

describe('mixins/next-step', () => {

    let BaseController, StubController;
    let req, res, controller;

    beforeEach(() => {
        let options = {
            route: '/step1',
            next: 'nextstep'
        };

        req = request({
            form: { options },
            baseUrl: '/base',
            path: '/request/path'
        });
        res = response();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = nextStepMixin(BaseController);
        controller = new StubController(options);
    });

    it('should export a function', () => {
        nextStepMixin.should.be.a.function;
        nextStepMixin.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });


    describe('_decodeDateString', () => {
        let clock;
        beforeEach(() => {
            clock = sinon.useFakeTimers(new Date('2016-10-22T12:10:10').getTime());
        });

        afterEach(() => {
            clock.restore();
        });

        it('should return today if no value is given', () => {
            controller._decodeDateString()
                .format('YYYY-MM-DD HH:mm:ss').should.equal('2016-10-22 00:00:00');
        });

        it('should return next day if interval is 1 day', () => {
            controller._decodeDateString('1 day')
                .format('YYYY-MM-DD').should.equal('2016-10-23');
        });

        it('should return previous day if interval is 1 day ago', () => {
            controller._decodeDateString('1 day ago')
                .format('YYYY-MM-DD').should.equal('2016-10-21');
        });

        it('should return next year if unit is not given', () => {
            controller._decodeDateString('1')
                .format('YYYY-MM-DD').should.equal('2017-10-22');
        });

        it('should return previous year if unit is not given', () => {
            controller._decodeDateString('1 ago')
                .format('YYYY-MM-DD').should.equal('2015-10-22');
        });

        it('should decode multiple units', () => {
            controller._decodeDateString('1 year and 5 days ago')
                .format('YYYY-MM-DD').should.equal('2015-10-17');
        });
    });

    describe('_defaultConditionFunction', () => {
        let fn, clock;
        beforeEach(() => {
            req.sessionModel.set('field1', 100);
            fn = controller._defaultConditionFunction.bind(controller);
            clock = sinon.useFakeTimers(new Date('2016-10-22').getTime());
        });

        afterEach(() => {
            clock.restore();
        });

        it('should use a default operator of ===', () => {
            fn(req, res, { field: 'field1', value: 100 }).should.equal(true);
            fn(req, res, { field: 'field1', value: 55 }).should.equal(false);
        });

        it('should compare value with >', () => {
            fn(req, res, { field: 'field1', op: '>', value: 99 }).should.equal(true);
            fn(req, res, { field: 'field1', op: '>', value: 100 }).should.equal(false);
        });

        it('should compare value with <', () => {
            fn(req, res, { field: 'field1', op: '<', value: 101 }).should.equal(true);
            fn(req, res, { field: 'field1', op: '<', value: 100 }).should.equal(false);
        });

        it('should compare value with >=', () => {
            fn(req, res, { field: 'field1', op: '>=', value: 100 }).should.equal(true);
            fn(req, res, { field: 'field1', op: '>=', value: 101 }).should.equal(false);
        });

        it('should compare value with <=', () => {
            fn(req, res, { field: 'field1', op: '<=', value: 100 }).should.equal(true);
            fn(req, res, { field: 'field1', op: '<=', value: 99 }).should.equal(false);
        });

        it('should compare value with ==', () => {
            fn(req, res, { field: 'field1', op: '==', value: '100' }).should.equal(true);
            fn(req, res, { field: 'field1', op: '==', value: 55 }).should.equal(false);
        });

        it('should compare value with !=', () => {
            fn(req, res, { field: 'field1', op: '!=', value: 55 }).should.equal(true);
            fn(req, res, { field: 'field1', op: '!=', value: '100' }).should.equal(false);
        });

        it('should compare value with before date', () => {
            req.sessionModel.set('field1', '2016-10-22');
            fn(req, res, { field: 'field1', op: 'before', value: '2016-10-23' }).should.equal(true);
            fn(req, res, { field: 'field1', op: 'before', value: '2016-10-22' }).should.equal(false);
        });

        it('should compare value with before time interval', () => {
            req.sessionModel.set('field1', '2016-11-30');
            fn(req, res, { field: 'field1', op: 'before', value: '2 months' }).should.equal(true);
            fn(req, res, { field: 'field1', op: 'before', value: '1 month' }).should.equal(false);
        });

        it('should compare value with after date', () => {
            req.sessionModel.set('field1', '2016-10-22');
            fn(req, res, { field: 'field1', op: 'after', value: '2016-10-21' }).should.equal(true);
            fn(req, res, { field: 'field1', op: 'after', value: '2016-10-22' }).should.equal(false);
        });

        it('should compare value with after time interval', () => {
            req.sessionModel.set('field1', '2016-11-30');
            fn(req, res, { field: 'field1', op: 'after', value: '1 month' }).should.equal(true);
            fn(req, res, { field: 'field1', op: 'after', value: '2 months' }).should.equal(false);
        });

    });

    describe('decodeConditions', () => {
        beforeEach(() => {
            req.sessionModel.set({
                field1: 99,
                field2: 'value',
                field3: '2016-10-22',
                field4: true,
            });
        });

        it('should return the next step if it is a string', () => {
            let nextStep = 'nextstep';
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: null,
                fields: []
            });
        });

        it('should return the next step if next array only contains a string', () => {
            let nextStep = [ 'nextstep' ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: null,
                fields: []
            });
        });

        it('should return the next step when next is a function', () => {
            let nextStep = sinon.stub().returns('nextStep');
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextStep',
                condition: null,
                fields: []
            });
            nextStep.should.have.been.calledWithExactly(req, res);
            nextStep.should.have.been.calledOn(controller);
        });

        it('should return the next step of a matched condition', () => {
            let nextStep = [
                { field: 'field1', value: 99, next: 'nextstep' },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: nextStep[0],
                fields: [ 'field1' ]
            });
        });

        it('should return the next step of a nested matched condition', () => {
            let nextStep = [
                {
                    field: 'field1', value: 99, next: [
                        { field: 'field2', value: 'value', next: 'nextstep' }
                    ]
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: nextStep[0].next[0],
                fields: [ 'field1', 'field2' ]
            });
        });

        it('should not return the next step of a condition that doesn\'t match a condition', () => {
            let nextStep = [
                {
                    field: 'field1', value: 99, next: [
                        { field: 'field2', value: 'anothervalue', next: 'otherstep' },
                        'nextstep'
                    ],
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: nextStep[0],
                fields: [ 'field1', 'field2' ]
            });
        });

        it('should return the next step of a matched function', () => {
            let fn = sinon.stub().returns(true);
            let nextStep = [
                {
                    fn: fn,
                    next: 'nextstep'
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: nextStep[0],
                fields: []
            });
            fn.should.have.been.calledOnce;
            fn.should.have.been.calledWithExactly(req, res, nextStep[0]);
            fn.should.have.been.calledOn(controller);
        });

        it('should return the next step of a matched function when next is a function', () => {
            let next = sinon.stub().returns('nextStep');
            let nextStep = [
                {
                    fn: () => true,
                    next
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextStep',
                condition: nextStep[0],
                fields: []
            });
            next.should.have.been.calledWithExactly(req, res);
            next.should.have.been.calledOn(controller);
        });

        it('should return the flattened unique fields used if a custom function is used', () => {
            let fn = sinon.stub().returns(true);
            let nextStep = [
                {
                    field: [ 'field1', 'field4', 'field4' ],
                    fn: fn,
                    next: 'nextstep'
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: nextStep[0],
                fields: [ 'field1', 'field4' ]
            });
        });

    });

    describe('getNextStepObject', () => {
        beforeEach(() => {
            controller.decodeConditions = sinon.stub().returns({
                url: 'returned/step'
            });
        });

        it('should return the value from the decoded conditions', () => {
            controller.getNextStepObject(req, res).should.deep.equal({ url: 'returned/step' });
            controller.decodeConditions.should.have.been.calledOnce;
            controller.decodeConditions.should.have.been.calledWithExactly(req, res, 'nextstep');
        });
    });

    describe('getNextStep', () => {
        beforeEach(() => {
            controller.getNextStepObject = sinon.stub().returns({
                url: 'nextstep'
            });
        });

        it('should return the resolved url from the decoded conditions', () => {
            controller.getNextStep(req, res).should.equal('/base/nextstep');
            controller.getNextStepObject.should.have.been.calledOnce;
            controller.getNextStepObject.should.have.been.calledWithExactly(req, res);
        });

        it('should return the resolved controller route if there is no url', () => {
            controller.getNextStepObject.returns({ url: null });
            controller.getNextStep(req, res).should.equal('/base/step1');
        });
    });

    describe('getErrorStep', () => {
        beforeEach(() => {
            controller.getNextStepObject = sinon.stub().returns({
                url: 'nextstep'
            });
        });

        it('should refresh the page if not all errors have redirects', () => {
            let err = [
                { code: 'A', redirect: 'redirect1' },
                { code: 'B' }
            ];
            controller.getErrorStep(err, req, res).should.equal('/base/request/path');
        });

        it('should redirect to first redirect if all errors have redirects', () => {
            let err = [
                { code: 'A', redirect: 'redirect1' },
                { code: 'B', redirect: 'redirect2'  }
            ];
            controller.getErrorStep(err, req, res).should.equal('/base/redirect1');
        });
    });

});
