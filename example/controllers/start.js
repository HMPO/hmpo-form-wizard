'use strict';

var util = require('util');
var Controller = require('hmpo-form-wizard').Controller;

var Start = function Start() {
  Controller.apply(this, arguments);
};

util.inherits(Start, Controller);

Start.prototype.saveValues = function saveValues(req, res, callback) {
  req.sessionModel.reset();
  callback();
};

module.exports = Start;
