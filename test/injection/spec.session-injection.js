'use strict';

const SessionInjection = require('../../injection/session-injection');

const proxyquire = require('proxyquire');

describe('Session Injection', () => {

    let req, injection;

    beforeEach(() => {
        req = request();
        injection = new SessionInjection();
    });

    describe('#inject', () => {
        beforeEach(() => {
            sinon.stub(injection, 'setFeatureFlags');
            sinon.stub(injection, 'createJourneyModel');
            sinon.stub(injection, 'setJourneyKeys');
            sinon.stub(injection, 'setNext');
            sinon.stub(injection, 'setPrereq');
            sinon.stub(injection, 'createWizardModels');
            sinon.stub(injection, 'setRawSessionValues');
        });

        it('throws an error if there is no session available', () => {
            expect(() => injection.inject({})).to.throw(/No express session/);
        });

        it('uses defaults for arguments that are no specified', () => {
            injection.inject(req, {});

            req.session.exists.should.equal(true);
            injection.setFeatureFlags.should.have.been.calledWithExactly(req, null);
            injection.createJourneyModel.should.have.been.calledWithExactly(req, 'default');
            injection.setJourneyKeys.should.have.been.calledWithExactly(req, null);
            injection.setNext.should.have.been.calledWithExactly(req, null);
            injection.setPrereq.should.have.been.calledWithExactly(req, null);
            injection.createWizardModels.should.have.been.calledWithExactly(req, null);
            injection.setRawSessionValues.should.have.been.calledWithExactly(req, null);
        });

        it('sets session exists to sessionExists value', () => {
            req.session.exists = true;
            injection.inject(req, { sessionExists: false });
            req.session.exists.should.equal(false);
        });

        it('calls setFeatureFlags with feature flag options', () => {
            injection.inject(req, { featureFlags: { foo: 'bar' }});
            injection.setFeatureFlags.should.have.been.calledWithExactly(req, { foo: 'bar' });
        });

        it('calls createJourneyModel with journey name from options', () => {
            injection.inject(req, { journeyName: 'my-journey' });
            injection.createJourneyModel.should.have.been.calledWithExactly(req, 'my-journey');
        });

        it('calls setNext with next path from options', () => {
            injection.inject(req, { allowedStep: '/path' });
            injection.setNext.should.have.been.calledWithExactly(req, '/path');
        });

        it('calls setPrereq with step path from options', () => {
            injection.inject(req, { prereqStep: '/path' });
            injection.setPrereq.should.have.been.calledWithExactly(req, '/path');
        });

        it('calls createWizardModels with wizard settings from options', () => {
            injection.inject(req, { wizardValues: { foo: 'bar' }});
            injection.createWizardModels.should.have.been.calledWithExactly(req, { foo: 'bar' });
        });

        it('calls setRawSessionValues with object from options', () => {
            injection.inject(req, { rawSessionValues: { foo: 'bar' }});
            injection.setRawSessionValues.should.have.been.calledWithExactly(req, { foo: 'bar' });
        });
    });

    describe('#setFeatureFlags', () =>  {
        it('sets feature flags on the session', () => {
            injection.setFeatureFlags(req, { flag: true });
            req.session.featureFlags.flag.should.equal(true);
        });

        it('overwrites any existing session feature flags', () => {
            req.session.featureFlags = { oldFlag: true };
            injection.setFeatureFlags(req, { flag: true });
            expect(req.session.featureFlags.oldFlag).to.be.undefined;
        });

        it('does not reset the feature flags if no flags are given', () => {
            req.session.featureFlags = { oldFlag: true };
            injection.setFeatureFlags(req, null);
            req.session.featureFlags.oldFlag.should.equal(true);
        });
    });

    describe('#createJourneyModel', () =>  {
        it('creates a new journey model on req', () => {
            let stubs = {};

            stubs.journeyModelInstance = {};
            stubs.JourneyModel = sinon.stub().returns(stubs.journeyModelInstance);
            stubs.SessionInjection = proxyquire('../../injection/session-injection', {
                '../lib/journey-model': stubs.JourneyModel
            });

            let injection = new stubs.SessionInjection();
            injection.createJourneyModel(req, 'name');

            stubs.JourneyModel.should.have.been.calledWithExactly(null, {
                req,
                key: 'hmpo-journey-name'
            });
            req.journeyModel.should.equal(stubs.journeyModelInstance);
        });
    });

    describe('#setJourneyKeys', () =>  {
        it('does not reset the journey if no journey keys are given', () => {
            injection.createJourneyModel(req, 'default');
            req.journeyModel.set('key', 'value');
            injection.setJourneyKeys(req, null);
            req.journeyModel.get('key').should.equal('value');
        });

        it('resets the journey', () => {
            injection.createJourneyModel(req, 'default');
            req.journeyModel.set('key', 'value');
            injection.setJourneyKeys(req, {});
            expect(req.journeyModel.get('key')).to.be.undefined;
        });

        it('sets a journey key', () => {
            injection.createJourneyModel(req, 'default');
            injection.setJourneyKeys(req, { key: 'value' });
            req.journeyModel.get('key').should.equal('value');
        });
    });

    describe('#setNext', () =>  {
        it('adds a history step with the given next path', () => {
            injection.createJourneyModel(req, 'default');
            injection.setNext(req, '/path');
            req.journeyModel.get('history').should.be.an('array');
            req.journeyModel.get('history')[0].should.contain({
                next: '/path'
            });
        });

        it('adds a history steps if an array of paths is given', () => {
            injection.createJourneyModel(req, 'default');
            injection.setNext(req, ['/path/one', '/path/two']);
            req.journeyModel.get('history').should.be.an('array');
            req.journeyModel.get('history')[0].should.contain({
                next: '/path/one'
            });
            req.journeyModel.get('history')[1].should.contain({
                next: '/path/two'
            });
        });
    });

    describe('#setPrereq', () =>  {
        it('adds a history step with the given step path', () => {
            injection.createJourneyModel(req, 'default');
            injection.setPrereq(req, '/path');
            req.journeyModel.get('history').should.be.an('array');
            req.journeyModel.get('history')[0].should.contain({
                path: '/path'
            });
        });

        it('adds a history steps if an array of paths is given', () => {
            injection.createJourneyModel(req, 'default');
            injection.setPrereq(req, ['/path/one', '/path/two']);
            req.journeyModel.get('history').should.be.an('array');
            req.journeyModel.get('history')[0].should.contain({
                path: '/path/one'
            });
            req.journeyModel.get('history')[1].should.contain({
                path: '/path/two'
            });
        });
    });

    describe('#createWizardModels', () =>  {
        let wizardModelInstance;
        beforeEach(() => {
            wizardModelInstance = {};
            sinon.stub(injection, 'createWizardModel').returns(wizardModelInstance);
            sinon.stub(injection, 'setWizardValues');
        });

        it('creates a model for each wizard supplied', () => {
            injection.createWizardModels(req, {
                name1: { key1: 'value1' },
                name2: { key2: 'value2' }
            });

            injection.createWizardModel.should.have.been.calledTwice;
            injection.createWizardModel.should.have.been.calledWithExactly(req, 'name1');
            injection.createWizardModel.should.have.been.calledWithExactly(req, 'name2');
        });

        it('calls setWizardValues for each model created', () => {
            injection.createWizardModels(req, {
                name1: { key1: 'value1' },
                name2: { key2: 'value2' }
            });

            injection.setWizardValues.should.have.been.calledWithExactly(
                wizardModelInstance,
                { key1: 'value1' }
            );
            injection.setWizardValues.should.have.been.calledWithExactly(
                wizardModelInstance,
                { key2: 'value2' }
            );
        });
    });

    describe('#setWizardValues', () =>  {
        let wizardModelInstance;

        beforeEach(() => {
            wizardModelInstance = {
                reset: sinon.stub(),
                set: sinon.stub()
            };
        });

        it('resets the wizard model', () => {
            injection.setWizardValues(wizardModelInstance, { key1: 'value1' });
            wizardModelInstance.reset.should.have.been.calledWithExactly();
        });

        it('sets values to the wizard model', () => {
            injection.setWizardValues(wizardModelInstance, { key1: 'value1' });
            wizardModelInstance.set.should.have.been.calledWithExactly({ key1: 'value1' });
        });
    });

    describe('#createWizardModel', () =>  {
        it('creates and returns a new wizard model', () => {
            let stubs = {};

            stubs.wizardModelInstance = {};
            stubs.WizardModel = sinon.stub().returns(stubs.wizardModelInstance);
            stubs.SessionInjection = proxyquire('../../injection/session-injection', {
                '../lib/wizard-model': stubs.WizardModel
            });
            stubs.journeyModelInstance = {};
            req.journeyModel = stubs.journeyModelInstance;

            let injection = new stubs.SessionInjection();
            let model = injection.createWizardModel(req, 'name');

            stubs.WizardModel.should.have.been.calledWithExactly(null, {
                req,
                key: 'hmpo-wizard-name',
                journeyModel: stubs.journeyModelInstance,
                fields: {}
            });
            model.should.equal(stubs.wizardModelInstance);
        });
    });

    describe('#setRawSessionValues', () =>  {
        it('set session items over the existing session', () => {
            let existingObject = { a: 1, b: 2 };
            req.session.existingObject = existingObject;
            injection.setRawSessionValues(req, {
                additonalObject: { foo: 'bar' },
                existingObject: { a: 3, boo: 'baz' },
                key: 'value'
            });
            req.session.existingObject.should.eql({ a: 3, boo: 'baz' });
            req.session.additonalObject.should.eql({ foo: 'bar' });
            req.session.key.should.equal('value');
        });

        it('does not alter session if null is supplied', () => {
            req.session = { foo: 'bar' };
            injection.setRawSessionValues(req, null);
            req.session.should.eql({ foo: 'bar' });
        });
    });

    describe('#middlewareDecodePayload', () =>  {
        let res, next;

        beforeEach(() => {
            res = response();
            next = sinon.stub();
        });

        it('sets the payload if a json body is given', () => {
            req.body = { key: 'value' };
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly();
            req.payload.should.eql({ key: 'value' });
        });

        it('sets the payload if a url encoded payload is given', () => {
            req.body = { payload: '{"key":"value"}' };
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly();
            req.payload.should.eql({ key: 'value' });
        });

        it('sets the payload if a JSON5 stype payload is given', () => {
            req.body = { payload: '{ key: \'value\' }' };
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly();
            req.payload.should.eql({ key: 'value' });
        });

        it('sets the payload to null if an empty url encoded payload is given', () => {
            req.body = { payload: '' };
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly();
            expect(req.payload).to.be.null;
        });

        it('sets the payload if a url encoded query parameter is given', () => {
            req.query = { payload: '{"key":"value"}' };
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly();
            req.payload.should.eql({ key: 'value' });
        });

        it('sets the payload to null if an empty url encoded query parameter is given', () => {
            req.query = { payload: '' };
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly();
            expect(req.payload).to.be.null;
        });

        it('should not set the payload if no payload is supplied', () => {
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly();
            expect(req.payload).to.be.undefined;
        });

        it('should call next with an error if invalid JSON is supplied', () => {
            req.query = { payload: '{"key":"value}' };
            injection.middlewareDecodePayload(req, res, next);
            next.should.have.been.calledWithExactly(sinon.match.instanceOf(Error));
            res.locals.payload.should.equal('{"key":"value}');
        });
    });

    describe('#middlewareHandler', () =>  {
        let res, next;

        beforeEach(() => {
            sinon.stub(injection, 'inject');
            req.journeyModel = {
                name: 'name',
                toJSON: sinon.stub().returns({ key: 'value' })
            };
            sinon.stub(injection, 'createJourneyModel');
            sinon.stub(injection, 'middlewareRender');
            res = response();
            next = sinon.stub();
        });

        it('does not call inject if a json body payload is not given', () => {
            req.payload = undefined;
            injection.middlewareHandler(req, res, next);
            injection.inject.should.not.have.been.called;
        });

        it('creates journey model on req if no payload is given', () => {
            req.payload = undefined;
            injection.middlewareHandler(req, res, next);
            injection.createJourneyModel.should.have.been.calledWithExactly(req, 'default');
        });

        it('creates named journey model based on last successfull payload', () => {
            req.payload = undefined;
            req.session.lastInjectionPayload = { journeyName: 'other' };
            injection.middlewareHandler(req, res, next);
            injection.createJourneyModel.should.have.been.calledWithExactly(req, 'other');
        });

        it('sets the last payload from the given payload', () => {
            req.session.lastInjectionPayload = {};
            req.payload = { key: 'value' };
            injection.middlewareHandler(req, res, next);
            req.session.lastInjectionPayload.should.eql({ key: 'value' });
        });

        it('resets the last payload if an empty body payload is given', () => {
            req.session.lastInjectionPayload = {};
            req.payload = null;
            injection.middlewareHandler(req, res, next);
            expect(req.session.lastInjectionPayload).to.be.null;
        });

        it('renders the webform', () => {
            injection.middlewareHandler(req, res, next);
            injection.middlewareRender.should.have.been.calledWithExactly(req, res, next);
        });
    });

    describe('#middlewareErrorHandler', () =>  {
        let err, res, next;

        beforeEach(() => {
            err = new Error('Message');
            res = response();
            next = sinon.stub();
            res.locals.payload = '{}';
            sinon.stub(injection, 'middlewareRender');
        });

        it('sets error message to locals.notice', () => {
            injection.middlewareErrorHandler(err, req, res, next);
            res.locals.notice.should.equal('Error: Message');
        });

        it('renders the template with the error message', () => {
            injection.middlewareErrorHandler(err, req, res, next);
            injection.middlewareRender.should.have.been.calledWithExactly(req, res, next);
        });
    });

    describe('#middlewareRender', () =>  {
        let res, next;

        beforeEach(() => {
            res = response();
            res.type = sinon.stub();
            res.send = sinon.stub();
            res.render = sinon.stub();
            next = sinon.stub();
            res.locals.payload = { journeyName: 'test' };
            res.locals.featureFlags = { flag: true };
            res.locals.journeyKeys = { key: 'value' };
        });

        it('renders the webform if html is accepted', () => {
            req.accepts.withArgs('html').returns(true);
            injection.middlewareRender(req, res, next);
            res.locals.payload.should.equal('{\n  journeyName: \'test\',\n}');
            res.locals.featureFlags.should.equal('{\n  flag: true,\n}');
            res.locals.journeyKeys.should.equal('{\n  key: \'value\',\n}');
            res.type.should.have.been.calledWithExactly('html');
            res.send.should.have.been.calledOnce;
            res.send.should.have.been.calledWithExactly(
                sinon.match(/<title>Session Injection<\/title>/)
            );
        });

        it('renders the example payload if no payload is available', () => {
            res.locals.payload = null;
            req.accepts.withArgs('html').returns(true);
            injection.middlewareRender(req, res, next);
            res.locals.payload.should.match(/^\{\n\s+journeyName: 'name',/);
        });

        it('renders unparsed payload if a parsing error occurred', () => {
            res.locals.payload = '{ json: error }';
            req.accepts.withArgs('html').returns(true);
            injection.middlewareRender(req, res, next);
            res.locals.payload.should.equal('{ json: error }');
        });

        it('sends JSON if json is accepted', () => {
            req.accepts.withArgs('json').returns(true);
            injection.middlewareRender(req, res, next);
            res.type.should.have.been.calledWithExactly('json');
            res.send.should.have.been.calledOnce;
            res.send.should.have.been.calledWithExactly({
                payload: { journeyName: 'test' },
                featureFlags: { flag: true },
                journeyKeys: { key: 'value' }
            });
        });

        it('sends text if neither is accepted', () => {
            injection.middlewareRender(req, res, next);
            res.type.should.have.been.calledWithExactly('txt');
            res.send.should.have.been.calledOnce;
            res.send.should.have.been.calledWithExactly(sinon.match.string);
        });
    });

    describe('#middleware', () =>  {
        let stubs;

        beforeEach(() => {
            stubs = {};
            stubs.bodyParser = {
                json: sinon.stub(),
                urlencoded: sinon.stub()
            };
            stubs.app = {
                use: sinon.stub(),
                get: sinon.stub()
            };
            stubs.express = sinon.stub().returns(stubs.app);

            stubs.SessionInjection = proxyquire('../../injection/session-injection', {
                'body-parser': stubs.bodyParser,
                'express': stubs.express
            });

            injection = new stubs.SessionInjection();
        });

        it('creates an express app', () => {
            injection.middleware();
            stubs.express.should.have.been.calledWithExactly();
        });

        it('uses the json body parser', () => {
            injection.middleware();
            stubs.bodyParser.json.should.have.been.calledWithExactly();
        });

        it('uses the url encoded body parser', () => {
            injection.middleware();
            stubs.bodyParser.urlencoded.should.have.been.calledWithExactly({extended: true});
        });

        it('returns created app', () => {
            let app = injection.middleware();
            app.should.equal(stubs.app);
        });
    });


});
