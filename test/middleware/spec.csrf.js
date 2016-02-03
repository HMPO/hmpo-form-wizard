var csrf = require('../../lib/middleware/csrf');

describe('CSRF protection', function () {

    var req, res, middleware;

    beforeEach(function () {
        req = request();
        res = { locals: {} };
        middleware = csrf('/', { options: {} });
    });

    it('accepts GET requests without a token', function (done) {
        req.method = 'GET';
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('accepts HEAD requests without a token', function (done) {
        req.method = 'HEAD';
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('accepts OPTIONS requests without a token', function (done) {
        req.method = 'OPTIONS';
        middleware(req, res, function (err) {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('generates a token on GET requests', function (done) {
        req.method = 'GET';
        middleware(req, res, function () {
            res.locals['csrf-token'].should.be.a('string');
            done();
        });
    });

    it('validates token in body on POST requests', function (done) {
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

    it('validates token in body on PUT requests', function (done) {
        req.method = 'GET';
        middleware(req, res, function () {
            var token = res.locals['csrf-token'];
            req.method = 'PUT';
            req.body['x-csrf-token'] = token;
            middleware(req, res, function (err) {
                expect(err).to.be.undefined;
                done();
            });
        });
    });

    it('validates token in headers on DELETE requests', function (done) {
        req.method = 'GET';
        middleware(req, res, function () {
            var token = res.locals['csrf-token'];
            req.method = 'DELETE';
            req.headers['x-csrf-token'] = token;
            middleware(req, res, function (err) {
                expect(err).to.be.undefined;
                done();
            });
        });
    });

    it('validates token in headers on PATCH requests', function (done) {
        req.method = 'GET';
        middleware(req, res, function () {
            var token = res.locals['csrf-token'];
            req.method = 'PATCH';
            req.headers['x-csrf-token'] = token;
            middleware(req, res, function (err) {
                expect(err).to.be.undefined;
                done();
            });
        });
    });

    it('passes error to callback if token in body is invalid', function (done) {
        req.method = 'POST';
        req.body['x-csrf-token'] = 'invalidtoken';
        middleware(req, res, function (err) {
            err.code.should.equal('CSRF_ERROR');
            done();
        });
    });

    it('passes error to callback if token in headers is invalid', function (done) {
        req.method = 'POST';
        req.headers['x-csrf-token'] = 'invalidtoken';
        middleware(req, res, function (err) {
            err.code.should.equal('CSRF_ERROR');
            done();
        });
    });

});
