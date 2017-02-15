'use strict';

const Model = require('../../model');

module.exports = Controller => class extends Controller {

    middlewareSetup() {
        super.middlewareSetup();
        this.use(this.createSessionModel);
    }

    createSessionModel(req, res, next) {
        if (typeof req.session === 'undefined') {
            throw new Error('Session is undefined');
        }

        if (req.sessionModel) {
            req.sessionModel.destroy();
        }

        req.sessionModel = new Model(null, {
            session: req.session,
            key: 'hmpo-wizard-' + req.form.options.name
        });

        if (req.form.options.reset && req.method === 'GET') {
            req.sessionModel.reset();
        }

        next();
    }

};
