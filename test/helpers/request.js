var reqres = require('reqres'),
    SessionModel = require('../../lib/model');

module.exports = function (settings) {
    var req = reqres.req(settings);
    req.sessionModel = req.sessionModel || new SessionModel({}, { session: req.session, key: 'hmpo-wizard-test' });
    return req;
};
