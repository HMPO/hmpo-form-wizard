'use strict';

const SessionModel = require('../lib/model');
const LocalModel = require('hmpo-model').Local;

describe('session model', () => {
    let req, session;

    beforeEach(() => {
        session = {};
        req = { session };
    });

    it('exports a function', () => {
        SessionModel.should.be.a('function');
    });

    describe('constructor', () => {
        it('should extend Local Model', () => {
            let model = new SessionModel(null, { key: 'test', req });
            model.should.be.an.instanceOf(LocalModel);
        });

        it('should throw an error if no options are provided', () => {
            expect(() => new SessionModel()).to.throw('session-model - req must be defined');
        });

        it('should throw an error if no req is provided in options', () => {
            expect(() => new SessionModel(null, {})).to.throw('session-model - req must be defined');
        });

        it('should throw an error if req is not an object', () => {
            expect(() => new SessionModel(null, { req: 'not-an-object' })).to.throw('session-model - req must be defined');
        });

        it('should throw an error if no session is provided in options', () => {
            expect(() => new SessionModel(null, { req: {} })).to.throw('session-model - req.session must be defined');
        });

        it('should throw an error if session is not an object', () => {
            expect(() => new SessionModel(null, { req: { session: 'not-an-object' } })).to.throw('session-model - req.session must be defined');
        });

        it('should throw an error if no key is provided in options', () => {
            expect(() => new SessionModel(null, { req: { session: {} } })).to.throw('session-model - key must be defined');
        });

        it('should throw an error if key is not a string', () => {
            expect(() => new SessionModel(null, { req: { session: {} }, key: 555 })).to.throw('session-model - key must be defined');
        });

        it('should create the named property in the session', () => {
            new SessionModel(null, { key: 'test', req });
            session.test.should.deep.equal({});
        });

        it('should use existing session object', () => {
            session.test = { existing: true };
            let sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel.toJSON().should.deep.equal({ existing: true });
        });

        it('should set supplied attrs to the session model', () => {
            session.test = { existing: true };
            let sessionModel = new SessionModel({ provided: 'attrValue' }, { key: 'test', req });
            sessionModel.toJSON().should.deep.equal({ existing: true, provided: 'attrValue' });
            session.test.provided.should.equal('attrValue');
        });
    });

    describe('data changes', () => {
        it('should update the session when data is changed', () => {
            let sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel.set('newValue', true);
            session.test.should.deep.equal({ newValue: true });
        });

        it('should update the session when data is unset', () => {
            session.test = { item1: true, item2: true, item3: true };
            let sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel.unset('item2');
            session.test.should.deep.equal({
                item1: true,
                item2: undefined,
                item3: true
            });
        });

        it('should update the session when data is reset', () => {
            session.test = { initalValue: true };
            let sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel.reset();
            session.test.should.deep.equal({});
        });
    });

    describe('save', () => {
        it('should save the session', () => {
            let cb = sinon.stub();
            session.save = sinon.stub();
            let sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel.save(cb);
            session.save.should.have.been.calledWithExactly(cb);
        });
    });

    describe('reload', () => {
        let cb, sessionModel;
        beforeEach(() => {
            cb = sinon.stub();
            session.reload = sinon.stub().yields();
            sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel._reload = sinon.stub();
        });

        it('should reload the session', () => {
            sessionModel.reload(cb);
            session.reload.should.have.been.calledWithExactly(sinon.match.func);
        });

        it('should callback any error reloading the session', () => {
            session.reload.yields('error');
            sessionModel.reload(cb);
            cb.should.have.been.calledWithExactly('error');
        });

        it('should call _reload to load in new session data', () => {
            sessionModel.reload(cb);
            sessionModel._reload.should.have.been.calledWithExactly();
        });

        it('should call callback', () => {
            sessionModel.reload(cb);
            cb.should.have.been.calledWithExactly();
        });
    });

    describe('_reload', () => {
        let sessionModel;

        beforeEach(() => {
            session.reload = sinon.stub().yields();
            sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel.getSessionData = sinon.stub().returns({ foo: 'bar' });
            sessionModel.reset = sinon.stub();
            sessionModel.set = sinon.stub();
        });

        it('should reset the sessionModel attributes', () => {
            sessionModel.attributes = { foo: 'bar '};
            sessionModel._reload();
            expect(sessionModel.attributes).to.eql({});
        });

        it('should silently set the sessionModel with session data', () => {
            sessionModel._reload();
            sessionModel.set.should.have.been.calledWithExactly({ foo: 'bar'}, { silent: true });
        });
    });

    describe('destroy', () => {
        it('should detach from the session and disable methods', () => {
            session.test = { item1: true, item2: true, item3: true };
            let sessionModel = new SessionModel(null, { key: 'test', req });
            sessionModel.destroy();
            expect(() => sessionModel.set('item2', 'changed') ).to.throw();
            session.test.should.deep.equal({
                item1: true,
                item2: true,
                item3: true
            });
            expect(sessionModel.options.req).to.be.null;
        });
    });

});
