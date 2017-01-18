'use strict';

const baseController = require('../../helpers/controller');
const invalidateFields = require('../../../lib/controller/mixins/invalidate-fields');

describe('mixins/invalidate-fields', () => {

    let BaseController, StubController;
    let req, res, next, controller, steps;

    beforeEach(() => {
        req = request();
        res = response();
        next = sinon.stub();

        req.sessionModel.set({
            'field1': true,
            'field2': true,
            'field3': true,
            'field4': true
        });

        steps = {
            '/step1': {
                route: '/step1'
            },
            '/step2': {
                route: '/step2'
            },
            '/step3': {
                route: '/step3'
            }
        };

        BaseController = baseController();
        StubController = invalidateFields(BaseController);
        controller = new StubController({
            route: '/step1',
            steps,
            fields: steps['/step1'].fields
        });

    });

    it('should export a function', () => {
        invalidateFields.should.be.a.function;
        invalidateFields.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareActions override', () => {
        it('calls the super method', () => {
            controller.middlewareActions();
            BaseController.prototype.middlewareActions.should.have.been.calledOnce;
        });

        it('uses the invalidateFields middleware', () => {
            controller.middlewareActions();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.invalidateFields
            );
        });
    });

    describe('invalidateFields middleware', () => {

        it('when no invalidations are specified no fields are removed', () => {
            controller.invalidateFields(req, res, next);
            req.sessionModel.set('field2', 'changed');

            req.sessionModel.toJSON().should.contain.all.keys(
                'field1',
                'field2',
                'field3',
                'field4'
            );
        });

        it('invalidates specified fields when value is changed', () => {
            controller.options.fields = {
                field2: {
                    invalidates: [ 'field3', 'field1' ]
                }
            };
            controller.invalidateFields(req, res, next);

            req.sessionModel.toJSON().should.contain.all.keys(
                'field1',
                'field2',
                'field3',
                'field4'
            );

            req.sessionModel.set('field2', 'changed');

            req.sessionModel.toJSON().should.contain.all.keys(
                'field2',
                'field4'
            );
            req.sessionModel.toJSON().should.not.contain.all.keys(
                'field1',
                'field3'
            );
        });

        it('does not invalidate field is set to the same value', () => {
            controller.options.fields = {
                field2: {
                    invalidates: [ 'field3', 'field1' ]
                }
            };
            controller.invalidateFields(req, res, next);

            req.sessionModel.set('field2', true);

            req.sessionModel.toJSON().should.contain.all.keys(
                'field1',
                'field2',
                'field3',
                'field4'
            );
        });

        it('invalidates step and following steps when value is changed', () => {
            req.sessionModel.set('steps', [
                '/step1',
                '/step2',
                '/step3',
                '/step4',
            ]);
            controller.options.fields = {
                field2: {
                    invalidates: [ 'field1', 'field3' ]
                }
            };
            controller.options.steps['/step2'].fields = {
                field1: {}
            };

            controller.invalidateFields(req, res, next);
            req.sessionModel.set('field2', 'changed');

            req.sessionModel.get('steps').should.deep.equal([
                '/step1'
            ]);
        });

        it('does not invalidate steps if no visited step uses invalidated field', () => {
            req.sessionModel.set('steps', [
                '/step1',
                '/step3',
                '/step4',
            ]);
            controller.options.fields = {
                field2: {
                    invalidates: [ 'field1', 'field3' ]
                }
            };
            controller.options.steps['/step2'].fields = {
                field1: {}
            };

            controller.invalidateFields(req, res, next);
            req.sessionModel.set('field2', 'changed');

            req.sessionModel.get('steps').should.deep.equal([
                '/step1',
                '/step3',
                '/step4',
            ]);
        });


        it('calls the next callback', () => {
            controller.invalidateFields(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

    });

});
