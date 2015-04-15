var Wizard = require('../lib/wizard');

describe('Form Wizard', function () {

    var wizard,
        requestHandler,
        req, res, next;

    describe('session', function () {

        beforeEach(function () {
            req = request();
            res = response();
            next = sinon.stub();
            requestHandler = sinon.stub().yields();
            wizard = Wizard({
                '/': {
                    controller: StubController({ requestHandler: requestHandler })
                }
            }, {}, { name: 'test-wizard' });
        });

        it('creates a namespace on the session', function (done) {
            wizard(req, res, function (err) {
                req.session['test-wizard'].should.eql({});
                done(err);
            });
        });

        it('creates a session model', function (done) {
            wizard(req, res, function (err) {
                req.sessionModel.should.be.an.instanceOf(require('hmpo-model'));
                done(err);
            });
        });

        it('initialises model with data from session', function (done) {
            req.session['test-wizard'] = {
                name: 'John'
            };
            wizard(req, res, function (err) {
                req.sessionModel.toJSON().should.eql({ name: 'John' });
                done(err);
            });
        });

    });

    describe('fields', function () {

        it('includes all fields in fields option', function () {
            var constructor = sinon.stub();
            wizard = Wizard({
                '/': {
                    controller: StubController({ constructor: constructor }),
                    fields: ['field1', 'field2']
                }
            }, { field1: { validate: 'required' } }, { name: 'test-wizard' });

            constructor.args[0][0].fields.should.eql({
                field1: { validate: 'required' },
                field2: undefined
            });

        });

    });

});