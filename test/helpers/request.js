'use strict';

const reqres = require('reqres');
const WizardModel = require('../../lib/wizard-model');
const JourneyModel = require('../../lib/journey-model');

module.exports = settings => {
    let req = reqres.req(settings);
    req.journeyModel = new JourneyModel(null, {
        req,
        key: 'hmpo-journey-test'
    });
    req.sessionModel = new WizardModel(null, {
        req,
        key: 'hmpo-wizard-test',
        journeyModel: req.journeyModel,
        fields: {}
    });
    return req;
};
