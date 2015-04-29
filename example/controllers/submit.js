var util = require('util'),
    _ = require('underscore');

var Controller = require('hmpo-form-wizard').Controller,
    Model = require('../models/submit');

var Submit = function () {
    Controller.apply(this, arguments);
}

util.inherits(Submit, Controller);

Submit.prototype.saveValues = function (req, res, callback) {
    var data = _.pick(req.sessionModel.toJSON(), Object.keys(require('../routes/fields'))),
        model = new Model(data);
        model.save(callback);
}

module.exports = Submit;
