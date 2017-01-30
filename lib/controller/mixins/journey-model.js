'use strict';

const Model = require('../../model');

module.exports = Controller => class extends Controller {

    middlewareSetup() {
        super.middlewareSetup();
        this.use(this.createJourneyModel);
    }

    createJourneyModel(req, res, next) {
        if (typeof req.session === 'undefined') {
            throw new Error('Session is undefined');
        }

        if (req.journeyModel) {
            req.journeyModel.destroy();
        }

        req.journeyModel = new Model(null, {
            session: req.session,
            key: 'hmpo-journey-' + this.options.journeyName
        });

        if (this.options.resetJourney) {
            req.journeyModel.reset();
        }

        next();
    }

};
