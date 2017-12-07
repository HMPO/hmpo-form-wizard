'use strict';

const JourneyModel = require('../lib/journey-model');
const SessionModel = require('../lib/model');

describe('journey model', () => {
    let req, session, journeyModel;

    beforeEach(() => {
        session = {
            journeyKey: {}
        };
        req = { session };
        journeyModel = new JourneyModel(null, { key: 'journeyKey', req });
    });

    it('exports a function', () => {
        SessionModel.should.be.a('function');
    });

    it('should be an instance of SessionModel', () => {
        journeyModel.should.be.an.instanceOf(SessionModel);
    });

    describe('registerModel', () => {
        it('should add the model to the list of currently registered models', () => {
            let modelStub = {
                options: { key: 'wizard1' }
            };
            journeyModel.registerModel(modelStub);
            journeyModel.currentModels.should.deep.equal([
                modelStub
            ]);
        });

        it('should keep existing registered models when registering a new model', () => {
            let modelStub1 = {
                options: { key: 'wizard1' }
            };
            let modelStub2 = {
                options: { key: 'wizard2' }
            };
            journeyModel.registerModel(modelStub1);
            journeyModel.registerModel(modelStub2);
            journeyModel.currentModels.should.deep.equal([
                modelStub1,
                modelStub2
            ]);
        });

        it('should add the model to the list of previously registered models', () => {
            let modelStub = {
                options: { key: 'wizard1' }
            };
            journeyModel.registerModel(modelStub);
            session.journeyKey['registered-models'].should.deep.equal(['wizard1']);
        });

        it('should keep existing models in the list of previously registered models', () => {
            let modelStub1 = {
                options: { key: 'wizard1' }
            };
            let modelStub2 = {
                options: { key: 'wizard2' }
            };
            journeyModel.registerModel(modelStub1);
            journeyModel.registerModel(modelStub2);
            session.journeyKey['registered-models'].should.deep.equal(['wizard1', 'wizard2']);
        });

        it('should not add duplicate model keys to the model list', () => {
            session.journeyKey = {
                'registered-models': [ 'wizard1' ]
            };
            journeyModel = new JourneyModel(null, { key: 'journeyKey', req });
            let modelStub = {
                options: { key: 'wizard1' }
            };
            journeyModel.registerModel(modelStub);
            session.journeyKey['registered-models'].should.deep.equal(['wizard1']);
        });
    });

    describe('reset', () => {
        it('should clear all previously registered models', () => {
            session.journeyKey = {
                'registered-models': [ 'wizard1', 'wizard2' ]
            };
            session.wizard1 = { present: true };
            session.wizard2 = { present: true };
            session.wizard3 = { present: true };
            journeyModel = new JourneyModel(null, { key: 'journeyKey', req });
            journeyModel.reset();
            session.journeyKey.should.deep.equal({});
            session.wizard1.should.deep.equal({});
            session.wizard2.should.deep.equal({});
            session.wizard3.should.deep.equal({ present: true });
        });

        it('should call reset on all currently registered models', () => {
            let modelStub = {
                reset: sinon.stub()
            };
            journeyModel.currentModels = [ modelStub ];
            journeyModel.reset();
            modelStub.reset.should.have.been.calledOnce;
        });
    });

    describe('reload', () => {
        let cb;
        beforeEach(() => {
            cb = sinon.stub();
            session.reload = sinon.stub().yields();
            sinon.stub(SessionModel.prototype, 'reload').yields();
        });

        afterEach(() => {
            SessionModel.prototype.reload.restore();
        });

        it('should call the super reload', () => {
            journeyModel.reload(cb);
            SessionModel.prototype.reload.should.have.been.calledWithExactly(sinon.match.func);
        });

        it('should callback any error from the super', () => {
            SessionModel.prototype.reload.yields('error');
            journeyModel.reload(cb);
            cb.should.have.been.calledWithExactly('error');
        });

        it('should call _reload on each registered wizard model', () => {
            let wizardModel = { _reload: sinon.stub() };
            journeyModel.currentModels = [ wizardModel ];
            journeyModel.reload(cb);
            wizardModel._reload.should.have.been.calledWithExactly();
        });

        it('should call callback', () => {
            journeyModel.reload(cb);
            cb.should.have.been.calledWithExactly();
        });
    });
});
