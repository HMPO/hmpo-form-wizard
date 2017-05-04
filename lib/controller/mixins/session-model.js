'use strict';

const WizardModel = require('../../wizard-model');
const _ = require('underscore');

module.exports = Controller => class extends Controller {

    middlewareSetup() {
        super.middlewareSetup();
        this.use(this.createSessionModel);
    }

    createSessionModel(req, res, next) {
        if (!req.session) {
            return next(new Error('Session is undefined'));
        }

        if (req.sessionModel) {
            req.sessionModel.destroy();
        }

        req.sessionModel = new WizardModel(null, {
            session: req.session,
            key: 'hmpo-wizard-' + req.form.options.name,
            journeyModel: req.journeyModel,
            fields: _.extend({}, req.form.options.allFields, req.form.options.fields)
        });

        if (req.form.options.reset && req.method === 'GET') {
            req.sessionModel.reset();
        }

        next();
    }

};
