var csrf = require('../../lib/middleware/csrf');

describe('CSRF protection', function () {

    var req, res, middleware;

    beforeEach(function () {
        req = request();
        res = { locals: {} };
        middleware = csrf('/', { options: {} });
    });

    it('generates a token on GET requests', function (done) {
        req.method = 'GET';
        middleware(req, res, function () {
            res.locals['csrf-token'].should.be.a('string');
            done();
        });
    });

    it('validates token on POST requests', function (done) {
        req.method = 'GET';
        middleware(req, res, function () {
            var token = res.locals['csrf-token'];
            req.method = 'POST';
            req.body['x-csrf-token'] = token;
            middleware(req, res, function (err) {
                expect(err).to.be.undefined;
                done();
            });
        });
    });

    it('passes error to callback if token is invalid', function (done) {
        req.method = 'POST';
        req.body['x-csrf-token'] = 'invalidtoken';
        middleware(req, res, function (err) {
            err.code.should.equal('CSRF_ERROR');
            done();
        });
    });

});