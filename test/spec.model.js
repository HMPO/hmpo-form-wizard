'use strict';

const SessionModel = require('../lib/model');
const LocalModel = require('hmpo-model').Local;

describe('session model', () => {

    it('exports a function', () => {
        SessionModel.should.be.a('function');
    });

    describe('constructor', () => {
        it('should extend Local Model', () => {
            let model = new SessionModel(null, { key: 'test', session: {} });
            model.should.be.an.instanceOf(LocalModel);
        });

        it('should throw an error if no options are provided', () => {
            expect(() => new SessionModel()).to.throw('session-model - session must be defined');
        });

        it('should throw an error if no session is provided in options', () => {
            expect(() => new SessionModel(null, {})).to.throw('session-model - session must be defined');
        });

        it('should throw an error if session is not an object', () => {
            expect(() => new SessionModel(null, { session: 'not-an-object' })).to.throw('session-model - session must be defined');
        });

        it('should throw an error if no key is provided in options', () => {
            expect(() => new SessionModel(null, { session: {} })).to.throw('session-model - key must be defined');
        });

        it('should throw an error if key is not a string', () => {
            expect(() => new SessionModel(null, { session: {}, key: 555 })).to.throw('session-model - key must be defined');
        });

        it('should create the named property in the session', () => {
            let session = {};
            new SessionModel(null, { key: 'test', session });
            session.test.should.deep.equal({});
        });

        it('should use existing session object', () => {
            let session = {
                test: { existing: true }
            };
            let sessionModel = new SessionModel(null, { key: 'test', session });
            sessionModel.toJSON().should.deep.equal({ existing: true });
        });

        it('should set supplied attrs to the session model', () => {
            let session = {
                test: { existing: true }
            };
            let sessionModel = new SessionModel({ provided: 'attrValue' }, { key: 'test', session });
            sessionModel.toJSON().should.deep.equal({ existing: true, provided: 'attrValue' });
            session.test.provided.should.equal('attrValue');
        });
    });

    describe('data changes', () => {
        it('should update the session when data is changed', () => {
            let session = {};
            let sessionModel = new SessionModel(null, { key: 'test', session });
            sessionModel.set('newValue', true);
            session.test.should.deep.equal({ newValue: true });
        });

        it('should update the session when data is unset', () => {
            let session = {
                test: { item1: true, item2: true, item3: true }
            };
            let sessionModel = new SessionModel(null, { key: 'test', session });
            sessionModel.unset('item2');
            session.test.should.deep.equal({
                item1: true,
                item2: undefined,
                item3: true
            });
        });

        it('should update the session when data is reset', () => {
            let session = {
                test: { initalValue: true }
            };
            let sessionModel = new SessionModel(null, { key: 'test', session });
            sessionModel.reset();
            session.test.should.deep.equal({});
        });
    });

    describe('destroy', () => {
        it('should detatch from the session and disable methods', () => {
            let session = {
                test: { item1: true, item2: true, item3: true }
            };
            let sessionModel = new SessionModel(null, { key: 'test', session });
            sessionModel.destroy();
            expect(() => sessionModel.set('item2', 'changed') ).to.throw();
            session.test.should.deep.equal({
                item1: true,
                item2: true,
                item3: true
            });
        });
    });

});
