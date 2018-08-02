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
            fullPath: '/base/step1',
            next: 'nextstep'
        };

        req = request({
            form: { options },
            baseUrl: '/base',
            originalUrl: '/original/url'
        });
        res = response();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = nextStepMixin(BaseController);
        controller = new StubController(options);
    });

    it('should export a function', () => {
        nextStepMixin.should.be.a('function');
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

        it('should check if value is in an array', () => {
            req.sessionModel.set('field1', 'foo');
            fn(req, res, { field: 'field1', op: 'in', value: ['foo', 'bar'] }).should.equal(true);
            fn(req, res, { field: 'field1', op: 'in', value: ['boo', 'baz'] }).should.equal(false);
        });

        it('should check if all values match', () => {
            req.sessionModel.set('field1', 'foo');
            req.sessionModel.set('field2', 'bar');
            fn(req, res, { field: ['field1', 'field2'], op: 'all', value: {field1: 'foo', field2: 'bar'} }).should.equal(true);
            fn(req, res, { field: ['field1', 'field2'], op: 'all', value: {field1: 'boo', field2: 'bar'} }).should.equal(false);
        });

        it('should check if some values match', () => {
            req.sessionModel.set('field1', 'foo');
            req.sessionModel.set('field2', 'bar');
            fn(req, res, { field: ['field1', 'field2'], op: 'some', value: {field1: 'boo', field2: 'bar'} }).should.equal(true);
            fn(req, res, { field: ['field1', 'field2'], op: 'some', value: {field1: 'boo', field2: 'baz'} }).should.equal(false);
        });

        it('should grab the field names form the value object if no fields are specified', () => {
            req.sessionModel.set('field1', 'foo');
            req.sessionModel.set('field2', 'bar');
            fn(req, res, { op: 'all', value: {field1: 'foo', field2: 'bar'} }).should.equal(true);
        });

        it('should run op function if it is a function', () => {
            let opFn = sinon.stub().returns(true);
            let obj = { field: 'field1', op: opFn, value: 99 };
            fn(req, res, obj).should.equal(true);
            opFn.should.have.been.calledWithExactly(100, req, res, obj);
        });

        it('should run op function with a list of fields', () => {
            req.sessionModel.set('field2', 200);
            let opFn = sinon.stub().returns(true);
            let obj = { field: ['field1', 'field2'], op: opFn, value: 99 };
            fn(req, res, obj).should.equal(true);
            opFn.should.have.been.calledWithExactly({field1: 100, field2: 200}, req, res, obj);
        });

        it('should run op function with an object of fields', () => {
            req.sessionModel.set('field2', 200);
            let opFn = sinon.stub().returns(false);
            let obj = { field: {f1: 'field1', f2: 'field2'}, op: opFn, value: 99 };
            fn(req, res, obj).should.equal(false);
            opFn.should.have.been.calledWithExactly({f1: 100, f2: 200}, req, res, obj);
        });

        it('should run op function with a mixed array fields', () => {
            req.sessionModel.set('field2', 200);
            let opFn = sinon.stub().returns(true);
            let obj = { field: ['field1', 'field2', { f2: 'field2' }], op: opFn, value: 99 };
            fn(req, res, obj).should.equal(true);
            opFn.should.have.been.calledWithExactly({field1: 100, field2: 200, f2: 200}, req, res, obj);
        });

        it('should run op function with no field specified', () => {
            let opFn = sinon.stub().returns(false);
            let obj = {op: opFn, value: 99 };
            fn(req, res, obj).should.equal(false);
            opFn.should.have.been.calledWithExactly(undefined, req, res, obj);
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
            nextStep.should.have.been.calledWithExactly(req, res, null);
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

        it('should invert the result if not is specified', () => {
            let nextStep = [
                { field: 'field1', not: true, value: 99, next: 'nextstep' },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'otherstep',
                condition: null,
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

        it('should return the next step of a matched function specified by name', () => {
            controller.func = sinon.stub().returns(true);
            let nextStep = [
                {
                    fn: 'func',
                    next: 'nextstep'
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: nextStep[0],
                fields: []
            });
            controller.func.should.have.been.calledOnce;
            controller.func.should.have.been.calledWithExactly(req, res, nextStep[0]);
            controller.func.should.have.been.calledOn(controller);
        });

        it('should throw an error if a named condition function does not exist', () => {
            let nextStep = [
                {
                    fn: 'func',
                    next: 'nextstep'
                },
                'otherstep'
            ];
            expect(() => controller.decodeConditions(req, res, nextStep)).to.throw();
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
            next.should.have.been.calledWithExactly(req, res, nextStep[0]);
            next.should.have.been.calledOn(controller);
        });

        it('should pass the condition object to the next function', () => {
            let nextFn = function (req, res, con) {
                return 'goto/' + con.conditionOption + '/' + req.sessionModel.get(con.field);
            };
            let nextStep = [
                {
                    fn: () => true,
                    field: 'field1',
                    conditionOption: 'foobar',
                    next: nextFn
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'goto/foobar/99',
                condition: nextStep[0],
                fields: [ 'field1' ]
            });
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

        it('should return the flattened unique fields from an array if a custom operator is used', () => {
            let fn = sinon.stub().returns(true);
            let nextStep = [
                {
                    field: [ 'field1', 'field4', 'field4' ],
                    op: fn,
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

        it('should return the flattened unique fields from an object if a custom operator is used', () => {
            let fn = sinon.stub().returns(true);
            let nextStep = [
                {
                    field: { f1: 'field1', f2: 'field4', f3: 'field4' },
                    op: fn,
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

        it('should return the flattened unique fields from an object if only a value object is specified', () => {
            let fn = sinon.stub().returns(true);
            let nextStep = [
                {
                    value: { field1: 'foo', field4: 'bar' },
                    op: fn,
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

        it('should return the flattened unique fields from a mixed array if a custom operator is used', () => {
            let fn = sinon.stub().returns(true);
            let nextStep = [
                {
                    field: [ 'field1', 'field4', { f2: 'field2', f3: 'field4' } ],
                    op: fn,
                    next: 'nextstep'
                },
                'otherstep'
            ];
            controller.decodeConditions(req, res, nextStep).should.deep.equal({
                url: 'nextstep',
                condition: nextStep[0],
                fields: [ 'field1', 'field4', 'field2' ]
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
            controller.getErrorStep(err, req, res).should.equal('/original/url');
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
