var checkSession = require('../../lib/middleware/check-session');

describe('middleware/check-session', function () {

    var req, res, next;

    beforeEach(function () {
        req = {
            path: '/test',
            method: 'GET',
            session: {},
            cookies: {
                'hmpo-wizard-sc': 1
            }
        };
        res = {
            cookie: sinon.stub()
        };
        next = sinon.stub();
    });

    it('throws session error if cookie exists, but session flag does not', function () {
        var middleware = checkSession('/route', { options: {} }, {}, '/first');
        middleware(req, res, function (err) {
            err.should.be.an.instanceOf(Error);
            err.code.should.equal('SESSION_TIMEOUT')
        });
    });

    it('does not throw session error if cookie does not exist', function () {
        req.cookies = {};
        var middleware = checkSession('/route', { options: {} }, {}, '/first');
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
        });
    });

    it('does not throw error on GET to first route', function () {
        var middleware = checkSession('/route', { options: {} }, {}, '/first');
        req.path = '/first';
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
        });
    });

    it('does not throw session error if controller checkSession option is false', function () {
        var middleware = checkSession('/route', { options: { checkSession: false } }, {}, '/first');
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
        });
    });

});