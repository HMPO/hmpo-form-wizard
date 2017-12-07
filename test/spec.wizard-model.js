'use strict';

const WizardModel = require('../lib/wizard-model');
const JourneyModel = require('../lib/journey-model');
const SessionModel = require('../lib/model');

describe('wizard model', () => {
    let wizardModel, journeyModel, req, session, fields;

    beforeEach(() => {
        sinon.stub(JourneyModel.prototype, 'registerModel');
        sinon.stub(JourneyModel.prototype, 'set');
        sinon.stub(JourneyModel.prototype, 'get').withArgs('foo').returns('bar');
        session = {};
        req = { session };
        journeyModel = new JourneyModel(null, { key: 'journey', req });
        fields = {
            a: {},
            b: { journeyKey: 'foo' },
            c: { default: 'baz'},
            d: { journeyKey: 'boo', default: 'bam' }
        };

        wizardModel = new WizardModel(null, {
            key: 'test',
            req,
            journeyModel,
            fields
        });
    });

    afterEach(() => {
        JourneyModel.prototype.registerModel.restore();
        JourneyModel.prototype.get.restore();
        JourneyModel.prototype.set.restore();
    });

    it('exports a function', () => {
        WizardModel.should.be.a('function');
    });

    it('should be an instance of SessionModel', () => {
        wizardModel.should.be.an.instanceOf(SessionModel);
    });

    describe('constructor', () => {
        it('should throw an error if no options are provided', () => {
            expect(() => new WizardModel()).to.throw();
        });

        it('should throw an error if no journeyModel is provided in options', () => {
            expect(() => new WizardModel(null, { fields })).to.throw('wizard-model - journeyModel must be defined');
        });

        it('should throw an error if journeyModel is not an instance of JourneyModel', () => {
            expect(() => new WizardModel(null, { fields, journeyModel: {} })).to.throw('wizard-model - journeyModel must be defined');
        });

        it('should throw an error if no fields are provided in options', () => {
            expect(() => new WizardModel(null, { journeyModel })).to.throw('wizard-model - fields must be defined');
        });

        it('should throw an error if fields is not an object', () => {
            expect(() => new WizardModel(null, { journeyModel, fields: true })).to.throw('wizard-model - fields must be defined');
        });

        it('should register this model with the journey model', () => {
            JourneyModel.prototype.registerModel.should.have.been.calledWithExactly(wizardModel);
        });
    });

    describe('getJourneyKeys', () => {
        it('should return journey keys indexed by field name', () => {
            wizardModel.getJourneyKeys().should.deep.equal({
                b: 'foo',
                d: 'boo'
            });
        });

        it('should return an empty object if there are no fields', () => {
            delete wizardModel.options.fields;
            wizardModel.getJourneyKeys().should.deep.equal({});
        });
    });

    describe('getDefaults', () => {
        it('should return defaults indexed by field name', () => {
            wizardModel.getDefaults().should.deep.equal({
                c: 'baz',
                d: 'bam'
            });
        });

        it('should return an empty object if there are no fields', () => {
            delete wizardModel.options.fields;
            wizardModel.getDefaults().should.deep.equal({});
        });
    });

    describe('getSessionData', () => {
        it('should load data in from the defaults, wizard and journey models', () => {
            session.test.a = 'val1';
            session.test.b = 'val2';
            wizardModel.getSessionData().should.deep.equal({
                a: 'val1', // from wizard data
                b: 'bar',  // from journey data
                c: 'baz',   // from default
                d: 'bam'   // from default
            });
        });
    });

    describe('reset', () => {
        it('should load in defaults and journey data after resetting ', () => {
            session.test.a = 'val1';
            session.test.b = 'val2';
            session.test.c = 'val3';
            session.test.d = 'val4';
            wizardModel.reset();
            wizardModel.toJSON().should.deep.equal({
                b: 'bar',  // from journey data
                c: 'baz',   // from default
                d: 'bam'   // from default
            });
        });
    });

    describe('updateSessionData', () => {
        it('should update the session when data is changed', () => {
            wizardModel.set('newValue', true);
            session.test.should.deep.equal({ newValue: true });
        });

        it('should update the journey model when a journeyKey item is set', () => {
            wizardModel.set('b', 'value');
            session.test.should.deep.equal({});
            JourneyModel.prototype.set.should.have.been.calledWithExactly({
                foo: 'value'
            });
        });
    });

    describe('reload', () => {
        it('should call reload on the journey model', () => {
            let cb = sinon.stub();
            journeyModel.reload = sinon.stub();

            wizardModel.reload(cb);

            journeyModel.reload.should.have.been.calledWithExactly(cb);
        });
    });
});
