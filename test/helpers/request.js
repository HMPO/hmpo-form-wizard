'use strict';

const reqres = require('reqres');
const SessionModel = require('../../lib/model');

module.exports = settings => {
    let req = reqres.req(settings);
    req.sessionModel = new SessionModel(null, {
        session: req.session,
        key: 'hmpo-wizard-test'
    });
    req.journeyModel = new SessionModel(null, {
        session: req.session,
        key: 'hmpo-journey-test'
    });
    return req;
};
