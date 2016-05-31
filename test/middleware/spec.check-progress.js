var checkProgress = require('../../lib/middleware/check-progress'),
    Model = require('../../lib/model'),
    Controller = require('../../lib/controller'),
    helpers = require('../../lib/util/helpers');

describe('middleware/check-session', function () {

    var req, res, controller, steps;

    beforeEach(function () {
        req = request();
        req.sessionModel = new Model({}, { session: req.session, key: 'test' });
        res = response();
        controller = new Controller({ template: 'index' });
        steps = {
            '/one': { next: '/two' },
            '/two': { next: '/three' },
            '/three': { next: '/four' },
            '/four': {}
        };
        sinon.stub(helpers, 'getRouteSteps').returns(['/one', '/two']);
    });

    afterEach(function () {
        helpers.getRouteSteps.restore();
    });

    it('calls getRouteSteps helper with route and steps', function () {
        checkProgress('/two', controller, steps, '/three');
        helpers.getRouteSteps.should.have.been.calledWithExactly('/two', steps);
    });

    it('calls callback with no arguments if prerequisite steps are complete', function (done) {
        req.sessionModel.set('steps', [ '/one', '/two' ]);
        var middleware = checkProgress('/three', controller, steps, '/one');
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('calls callback with MISSING_PREREQ error code if accessing step that has not had prerequisite steps complete', function (done) {
        req.sessionModel.set('steps', []);
        helpers.getRouteSteps.returns(['/two']);
        var middleware = checkProgress('/three', controller, steps, '/one');
        middleware(req, res, function (err) {
            err.code.should.equal('MISSING_PREREQ');
            done();
        });
    });

});
