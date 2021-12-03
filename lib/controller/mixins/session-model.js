'use strict';

const WizardModel = require('../../wizard-model');

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
            req,
            key: 'hmpo-wizard-' + req.form.options.name,
            journeyModel: req.journeyModel,
            fields: Object.assign({}, req.form.options.allFields, req.form.options.fields)
        });

        next();
    }

    middlewareActions() {
        super.middlewareActions();
        this.use(this.resetSessionModel);
    }

    resetSessionModel(req, res, next) {
        if (req.form.options.reset && req.method === 'GET') {
            req.sessionModel.reset();
        }
        next();
    }

};
