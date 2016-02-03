var csrf = require('csrf')();
var _ = require('underscore');

module.exports = function (route, controller) {

    if (controller.options.csrf !== false) {
        return function csrfparser(req, res, next) {

            var verify = function () {
                var secret = req.sessionModel.get('csrf-secret');
                var safeMethods = ['GET', 'HEAD', 'OPTIONS'];

                if (!secret) {
                    csrf.secret(function (err, secret) {
                        if (err) { next(err); }
                        req.sessionModel.set('csrf-secret', secret);
                        verify();
                    });
                } else if (-1 !== _.indexOf(safeMethods, req.method)) {
                    // The HTTP method is safe. No need to verify a
                    // token. Instead, provide a new one for future
                    // verification.
                    res.locals['csrf-token'] = csrf.create(secret);
                    next();
                } else {
                    // The HTTP method is assumed to be unsafe so
                    // require verification.

                    // Token can be provided in either the request body
                    // or the headers. Preference is given to the body.
                    var token = req.body['x-csrf-token']
                             || req.headers['x-csrf-token'];

                    if (!csrf.verify(secret, token)) {
                        next({ code: 'CSRF_ERROR' });
                    } else {
                        next();
                    }
                }
            };

            verify();
        };
    } else {
        return function (req, res, next) { next(); };
    }

};
