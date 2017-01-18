'use strict';

const Controller = require('hmpo-form-wizard').Controller;

class Start extends Controller {
    saveValues(req, res, callback) {
        req.sessionModel.reset();
        callback();
    }
}

module.exports = Start;
