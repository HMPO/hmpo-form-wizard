'use strict';

const Controller = require('hmpo-form-wizard').Controller;
const Model = require('../models/submit');

class Submit extends Controller {
    saveValues(req, res, callback) {
        let data = req.sessionModel.toJSON();
        let model = new Model(data);
        model.save(callback);
    }
}

module.exports = Submit;
