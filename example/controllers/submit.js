'use strict';

var util = require('util');
var _ = require('underscore');
var Controller = require('hmpo-form-wizard').Controller;
var Model = require('../models/submit');

var Submit = function Submit() {
  Controller.apply(this, arguments);
};

util.inherits(Submit, Controller);

Submit.prototype.saveValues = function saveValues(req, res, callback) {
  var data = _.pick(req.sessionModel.toJSON(), Object.keys(require('../routes/fields')));
  var model = new Model(data);
  model.save(callback);
};

module.exports = Submit;
