var csrf = require('csrf')();

module.exports = function (route, controller) {

    if (controller.options.csrf !== false) {
        return function csrfparser(req, res, next) {

            var verify = function () {
                var secret = req.sessionModel.get('csrf-secret');
                if (!secret) {
                    csrf.secret(function (err, secret) {
                        if (err) { next(err); }
                        req.sessionModel.set('csrf-secret', secret);
                        verify();
                    });
                } else if (req.method === 'GET') {
                    res.locals['csrf-token'] = csrf.create(secret);
                    next();
                } else if (!csrf.verify(secret, req.body['x-csrf-token'])) {
                    next({ code: 'CSRF_ERROR' });
                } else {
                    next();
                }
            };

            verify();
        };
    } else {
        return function (req, res, next) { next(); };
    }

};