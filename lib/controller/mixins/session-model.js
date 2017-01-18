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
            key: 'hmpo-wizard-' + this.options.name
        });
        next();
    }

};
