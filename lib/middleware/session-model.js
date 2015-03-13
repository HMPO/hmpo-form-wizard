var Model = require('../model');

module.exports = function (options) {
    return function (req, res, next) {
        req.sessionModel = new Model({}, {
            session: req.session,
            key: options.name
        });
        next();
    };
};