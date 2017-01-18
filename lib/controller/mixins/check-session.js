'use strict';

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.checkSession);
    }

    checkSession(req, res, next) {
        if (this.options.checkSession !== false && (req.method === 'POST' || this.options.route !== this.options.firstStep)) {
            if (req.cookies['hmpo-wizard-sc'] && req.session.exists !== true) {
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
