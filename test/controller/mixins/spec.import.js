'use strict';

const baseController = require('../../helpers/controller');
const resolvePath = require('../../../lib/controller/mixins/resolve-path');
const importFields = require('../../../lib/controller/mixins/import');

describe('mixins/invalidate-journey', () => {

    let BaseController, StubController;
    let req, res, next, controller;

    beforeEach(() => {
        let options = {
            route: '/one',
            name: 'current'
        };

        req = request({
            form: { options },
            baseUrl: '/base',
            session: {
                'hmpo-wizard-name': {
                    field1: 'foo',
                    field2: 'bar'
                },
                'hmpo-wizard-other': {
                    field3: 'baz'
                }
            }
        });
        res = response();
        next = sinon.stub();

        BaseController = baseController();
        BaseController = resolvePath(BaseController);
        StubController = importFields(BaseController);
        controller = new StubController(options);

        req.journeyModel.set('dataSources', {
            field1: { path: '/base/one', wizard: 'current' },
            field2: { path: '/base/two', wizard: 'name' },
            field3: { path: '/other/three', wizard: 'other' }
        });
    });

    it('should export a function', () => {
        importFields.should.be.a.function;
        importFields.length.should.equal(1);
    });

    it('should extend a passed controller', () => {
        controller.should.be.an.instanceOf(BaseController);
    });

    describe('middlewareChecks override', () => {
        it('calls the super method', () => {
            controller.middlewareChecks();
            BaseController.prototype.middlewareChecks.should.have.been.calledOnce;
        });

        it('uses the importJourneyData middleware', () => {
            controller.middlewareChecks();
            BaseController.prototype.use.should.have.been.calledOnce;
            BaseController.prototype.use.should.have.been.calledWithExactly(
                controller.importJourneyData
            );
        });
    });

    describe('importJourneyData', () => {
        it('adds a changes event to the session model', () => {
            controller._recordJourneyData = sinon.stub();
            controller.importJourneyData(req, res, next);
            req.sessionModel.set({ a: 1, b: 2 });
            controller._recordJourneyData.should.have.been.calledOnce;
            controller._recordJourneyData.should.have.been.calledWithExactly(
                req,
                res,
                { a: 1, b: 2 }
            );
        });

        it('should call the next callback', () => {
            controller.importJourneyData(req, res, next);
            next.should.have.been.calledOnce;
            next.should.have.been.calledWithExactly();
        });

        it('should import fields specified in config', () => {
            req.form.options.import = {
                'field2': true,
                'field3': true
            };
            controller.importJourneyData(req, res, next);
            req.sessionModel.get('field2').should.equal('bar');
            req.sessionModel.get('field3').should.equal('baz');
        });

        it('should ignore non-existant non-required fields', () => {
            req.form.options.import = {
                'field2': true,
                'field4': { required: false }
            };
            controller.importJourneyData(req, res, next);
            req.sessionModel.get('field2').should.equal('bar');
            expect(req.sessionModel.get('field3')).to.not.be.ok;
        });

        it('should return an error for non-existant required fields', () => {
            req.form.options.import = {
                'field2': true,
                'field4': true
            };
            controller.importJourneyData(req, res, next);
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
            next.args[0][0].code.should.equal('MISSING_IMPORT');
        });

        it('should not set any imports if one is missing', () => {
            req.form.options.import = {
                'field2': true,
                'field4': true
            };
            controller.importJourneyData(req, res, next);
            expect(req.sessionModel.get('field1')).to.not.be.ok;
            expect(req.sessionModel.get('field4')).to.not.be.ok;
        });

        it('should not set any imports if there are no data sources in history', () => {
            req.journeyModel.unset('dataSources');
            req.form.options.import = {
                'field2': true,
            };
            controller.importJourneyData(req, res, next);
            expect(req.sessionModel.get('field2')).to.not.be.ok;
        });

        it('should not set any imports if the wizard model is missing', () => {
            req.journeyModel.set('dataSources', {
                field1: { path: '/base/one', wizard: 'missing' }
            });
            req.form.options.import = {
                'field1': true
            };
            controller.importJourneyData(req, res, next);
            expect(req.sessionModel.get('field1')).to.not.be.ok;
        });

        it('should not imports data from itself', () => {
            req.form.options.import = {
                'field1': true
            };
            controller.importJourneyData(req, res, next);
            expect(req.sessionModel.get('field1')).to.not.be.ok;
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
            next.args[0][0].code.should.equal('MISSING_IMPORT');
        });
    });

    describe('_recordJourneyData', () => {
        it('should not change the step history if there are no changes', () => {
            controller._recordJourneyData(req, res, {});
            req.journeyModel.get('dataSources').should.deep.equal({
                field1: { path: '/base/one', wizard: 'current' },
                field2: { path: '/base/two', wizard: 'name' },
                field3: { path: '/other/three', wizard: 'other' }
            });
        });

        it('should create dataSources if it doesn\'t exist', () => {
            req.journeyModel.unset('dataSources');
            controller._recordJourneyData(req, res, { field4: 'value' });
            req.journeyModel.get('dataSources').should.deep.equal({
                field4: { path: '/base/one', wizard: 'current' }
            });
        });

        it('should add field it doesn\'t exist', () => {
            controller._recordJourneyData(req, res, { field4: 'value' });
            req.journeyModel.get('dataSources').should.deep.equal({
                field1: { path: '/base/one', wizard: 'current' },
                field2: { path: '/base/two', wizard: 'name' },
                field3: { path: '/other/three', wizard: 'other' },
                field4: { path: '/base/one', wizard: 'current' }
            });
        });

        it('should not add field it exists', () => {
            controller._recordJourneyData(req, res, { field2: 'value' });
            req.journeyModel.get('dataSources').should.deep.equal({
                field1: { path: '/base/one', wizard: 'current' },
                field2: { path: '/base/two', wizard: 'name' },
                field3: { path: '/other/three', wizard: 'other' }
            });
        });
    });

    describe('getNextStepObject', () => {
        beforeEach(() => {
            BaseController.prototype.getNextStepObject = sinon.stub().returns({
                url: 'nextstep',
                fields: [ 'field5', 'field6' ]
            });
        });

        it('should add the importing field names to next step field history', () => {
            req.form.options.import = {
                'field1': true
            };
            let nextStep = controller.getNextStepObject(req, res);
            nextStep.fields.should.deep.equal([
                'field5',
                'field6',
                'field1'
            ]);
        });

        it('should not add duplicate field names to history', () => {
            req.form.options.import = {
                'field5': true
            };
            let nextStep = controller.getNextStepObject(req, res);
            nextStep.fields.should.deep.equal([
                'field5',
                'field6'
            ]);
        });

        it('should only add next step fields if import is not defined', () => {
            let nextStep = controller.getNextStepObject(req, res);
            nextStep.fields.should.deep.equal([
                'field5',
                'field6'
            ]);
        });

        it('should not add any fields property if import is empty and there are no next step fields', () => {
            req.form.options.import = {};
            BaseController.prototype.getNextStepObject.returns({
                url: 'nextstep'
            });
            let nextStep = controller.getNextStepObject(req, res);
            expect(nextStep.fields).to.be.undefined;
        });
    });

});

