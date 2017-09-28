'use strict';

const JourneyModel = require('../lib/journey-model');
const SessionModel = require('../lib/model');

describe('journey model', () => {

    it('exports a function', () => {
        SessionModel.should.be.a('function');
    });

    it('should be an instance of SessionModel', () => {
        let journeyModel = new JourneyModel(null, { key: 'journeyKey', session: {} });
        journeyModel.should.be.an.instanceOf(SessionModel);
    });

    describe('registerModel', () => {
        it('should add the model to the list of currently registered models', () => {
            let session = {
                journeyKey: {}
            };
            let modelStub = {
                options: { key: 'wizard1' }
            };
            let journeyModel = new JourneyModel(null, { key: 'journeyKey', session });
            journeyModel.registerModel(modelStub);
            journeyModel.currentModels.should.deep.equal([
                modelStub
            ]);
        });

        it('should keep existing registered models when registering a new model', () => {
            let session = {
                journeyKey: {}
            };
            let modelStub1 = {
                options: { key: 'wizard1' }
            };
            let modelStub2 = {
                options: { key: 'wizard2' }
            };
            let journeyModel = new JourneyModel(null, { key: 'journeyKey', session });
            journeyModel.registerModel(modelStub1);
            journeyModel.registerModel(modelStub2);
            journeyModel.currentModels.should.deep.equal([
                modelStub1,
                modelStub2
            ]);
        });

        it('should add the model to the list of previously registered models', () => {
            let session = {
                journeyKey: {}
            };
            let modelStub = {
                options: { key: 'wizard1' }
            };
            let journeyModel = new JourneyModel(null, { key: 'journeyKey', session });
            journeyModel.registerModel(modelStub);
            session.journeyKey['registered-models'].should.deep.equal(['wizard1']);
        });

        it('should keep existing models in the list of previously registered models', () => {
            let session = {
                journeyKey: {}
            };
            let modelStub1 = {
                options: { key: 'wizard1' }
            };
            let modelStub2 = {
                options: { key: 'wizard2' }
            };
            let journeyModel = new JourneyModel(null, { key: 'journeyKey', session });
            journeyModel.registerModel(modelStub1);
            journeyModel.registerModel(modelStub2);
            session.journeyKey['registered-models'].should.deep.equal(['wizard1', 'wizard2']);
        });

        it('should not add duplicate model keys to the model list', () => {
            let session = {
                journeyKey: {
                    'registered-models': [ 'wizard1' ]
                }
            };
            let modelStub = {
                options: { key: 'wizard1' }
            };
            let journeyModel = new JourneyModel(null, { key: 'journeyKey', session });
            journeyModel.registerModel(modelStub);
            session.journeyKey['registered-models'].should.deep.equal(['wizard1']);
        });
    });

    describe('reset', () => {
        it('should clear all previously registered models', () => {
            let session = {
                journeyKey: {
                    'registered-models': [ 'wizard1', 'wizard2' ]
                },
                wizard1: { present: true },
                wizard2: { present: true },
                wizard3: { present: true }
            };
            let journeyModel = new JourneyModel(null, { key: 'journeyKey', session });
            journeyModel.reset();
            session.journeyKey.should.deep.equal({});
            session.wizard1.should.deep.equal({});
            session.wizard2.should.deep.equal({});
            session.wizard3.should.deep.equal({ present: true });
        });

        it('should call reset on all currently registered models', () => {
            let session = {
                journeyKey: {},
            };

            let modelStub = {
                reset: sinon.stub()
            };

            let journeyModel = new JourneyModel(null, { key: 'journeyKey', session });
            journeyModel.currentModels = [ modelStub ];
            journeyModel.reset();
            modelStub.reset.should.have.been.calledOnce;
        });
    });

});
