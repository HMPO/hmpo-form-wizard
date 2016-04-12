'use strict';

var Model = require('../model');

module.exports = function addSessionModel(options) {
  return function sessionModelMiddleware(req, res, next) {
    req.sessionModel = new Model({}, {
      session: req.session,
      key: options.name
    });
    next();
  };
};
