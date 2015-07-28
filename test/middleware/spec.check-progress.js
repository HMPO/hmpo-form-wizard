var checkSession = require('../../lib/middleware/check-progress'),
    Model = require('../../lib/model'),
    Controller = require('../../lib/controller');

describe('middleware/check-session', function () {

    var req, res, next, controller, steps;

    beforeEach(function () {
        req = request();
        req.sessionModel = new Model({}, { session: req.session, key: 'test' });
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
        var middleware = checkSession('/three', controller, steps, '/one');
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('calls callback with MISSING_PREREQ error code if accessing step that has not had prerequisite steps complete', function (done) {
        req.sessionModel.set('steps', []);
        var middleware = checkSession('/three', controller, steps, '/one');
        middleware(req, res, function (err) {
            err.code.should.equal('MISSING_PREREQ');
            done();
        });
    });

});