'use strict';

const _ = require('underscore');

const Controller = require('hmpo-form-wizard').Controller;
const Model = require('../models/submit');

class Submit extends Controller {
    saveValues(req, res, callback) {
        let data = _.pick(req.sessionModel.toJSON(), Object.keys(require('../routes/fields')));
        let model = new Model(data);
        model.save(callback);
    }
}

module.exports = Submit;
