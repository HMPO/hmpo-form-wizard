'use strict';

const JourneyModel = require('../../journey-model');

module.exports = Controller => class extends Controller {

    middlewareSetup() {
        super.middlewareSetup();
        this.use(this.createJourneyModel);
    }

    createJourneyModel(req, res, next) {
        if (!req.session) {
            return next(new Error('Session is undefined'));
        }

        if (req.journeyModel) {
            req.journeyModel.destroy();
        }

        req.journeyModel = new JourneyModel(null, {
            session: req.session,
            key: 'hmpo-journey-' + req.form.options.journeyName
        });

        if (req.form.options.resetJourney && req.method === 'GET') {
            req.journeyModel.reset();
        }

        next();
    }

};
