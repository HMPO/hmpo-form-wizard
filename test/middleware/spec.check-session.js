var checkSession = require('../../lib/middleware/check-session');

describe('middleware/check-session', function () {

    var req, res, next;

    beforeEach(function () {
        req = {
            path: '/test',
            method: 'GET',
            session: {},
            cookies: {
                'pex-sc': 1
            }
        };
        res = {
            cookie: sinon.stub()
        };
        next = sinon.stub();
    });

    it('does not throw session error if controller checkSession option is false', function () {
        var middleware = checkSession('/route', { options: { checkSession: false } }, {}, '/first');
        middleware(req, res, next);
        next.should.have.been.calledWithExactly();
    });

});