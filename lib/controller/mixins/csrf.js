'use strict';

const csrf = require('csrf')();
const _ = require('underscore');

const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.csrfGenerateSecret);
        this.use(this.csrfCheckToken);
    }

    middlewareLocals() {
        super.middlewareLocals();
        this.use(this.csrfGenerateSecret);
        this.use(this.csrfSetToken);
    }

    csrfGenerateSecret(req, res, next) {
        let secret = req.sessionModel.get('csrf-secret');
        if (secret) {
            return next();
        }

        csrf.secret((err, secret) => {
            if (err) { return next(err); }
            req.sessionModel.set('csrf-secret', secret);
            next();
        });
    }

    csrfCheckToken(req, res, next) {
        if (req.form.options.csrf === false) {
            return next();
        }

        if (_.contains(safeMethods, req.method)) {
            return next();
        }

        // The HTTP method is assumed to be unsafe so
        // require verification.

        let secret = req.sessionModel.get('csrf-secret');

        // Token can be provided in either the request body
        // or the headers. Preference is given to the body.
        let token = req.body['x-csrf-token']
                 || req.headers['x-csrf-token'];

        if (!csrf.verify(secret, token)) {
            let err = new Error('CSRF token is invalid');
            err.code = 'CSRF_ERROR';
            return next(err);
        }

        next();
    }

    csrfSetToken(req, res, next) {
        if (!_.contains(safeMethods, req.method)) {
            return next();
        }

        // The HTTP method is safe. No need to verify a
        // token. Instead, provide a new one for future
        // verification.
        let secret = req.sessionModel.get('csrf-secret');
        res.locals['csrf-token'] = csrf.create(secret);

        next();
    }

};
