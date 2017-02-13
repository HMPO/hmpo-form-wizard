'use strict';

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.checkSession);
    }

    checkSession(req, res, next) {
        if (!req.form.options.checkSession) {
            return next();
        }

        if (req.method === 'POST' || !req.form.options.entryPoint) {
            if (req.cookies['hmpo-wizard-sc'] && !req.session.exists) {
                let err = new Error('Session expired');
                err.code = 'SESSION_TIMEOUT';
                return next(err);
            }
        }
        req.session.exists = true;
        res.cookie('hmpo-wizard-sc', 1);
        next();
    }

};
