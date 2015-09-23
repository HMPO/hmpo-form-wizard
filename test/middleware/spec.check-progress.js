var checkProgress = require('../../lib/middleware/check-progress'),
    Model = require('../../lib/model'),
    Controller = require('../../lib/controller');

describe('middleware/check-progress', function () {

    var req, res, next, controller, steps;

    beforeEach(function () {
        req = request();
        req.sessionModel = new Model({}, { session: req.session, key: 'test' });
        req.header = sinon.stub();
        res = response();
        next = sinon.stub();
        controller = new Controller({ template: 'index' });
        steps = {
            '/one': { next: '/two' },
            '/two': { next: '/three' },
            '/three': { next: '/four' },
            '/four': {}
        }
    });

    it('calls callback with no arguments if prerequisite steps are complete', function (done) {
        req.sessionModel.set('steps', [ '/one', '/two' ]);
        var middleware = checkProgress('/three', controller, steps, '/one');
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('calls callback with no arguments if referer header contained allowReferer value', function (done) {

        steps['/one'].allowReferer = '/four';

        var middleware = checkProgress('/three', controller, steps, '/one');

        req.method = 'GET';
        req.header = sinon.stub().withArgs('Referer').returns('foo.com/four');

        req.sessionModel.set('steps', [ '/one', '/two' ]);

        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
        });

        controller.emit('complete', req, res, '/one');

        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('calls callback with MISSING_PREREQ error code if accessing step that has not had prerequisite steps complete', function (done) {
        req.sessionModel.set('steps', []);
        var middleware = checkProgress('/three', controller, steps, '/one');
        middleware(req, res, function (err) {
            err.code.should.equal('MISSING_PREREQ');
            done();
        });
    });


});
