var checkSession = require('../../lib/middleware/check-progress'),
    Model = require('../../lib/model');

describe('middleware/check-session', function () {

    var req, res, next, controller;

    beforeEach(function () {
        req = request();
        req.sessionModel = new Model({}, { session: req.session, key: 'test' });
        res = response();
        next = sinon.stub();
        controller = {
            on: function () {},
            options: {
                fields: {
                    field1: {},
                    field2: undefined
                }
            }
        };
    });

    it('does not throw if some fields are undefined', function () {
        var middleware = checkSession('/route', controller, {}, '/first');
        middleware(req, res, next);
        next.should.have.been.calledWithExactly();
    });

});