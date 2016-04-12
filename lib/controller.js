'use strict';

var util = require('util');
var _ = require('underscore');
var path = require('path');
var ErrorClass = require('./error');
var Form = require('hmpo-form-controller');

function Controller() {
  Form.apply(this, arguments);
  this.Error = ErrorClass;
}

util.inherits(Controller, Form);

Controller.prototype.getValues = function getValues(req, res, callback) {
  var json = req.sessionModel.toJSON();
  delete json.errorValues;
  callback(null, _.extend({}, json, req.sessionModel.get('errorValues')));
};

Controller.prototype.saveValues = function saveValues(req, res, callback) {
  req.sessionModel.set(req.form.values);
  req.sessionModel.unset('errorValues');
  callback();
};

Controller.prototype.getErrors = function getErrors(req) {
  var errs = req.sessionModel.get('errors');
  errs = _.pick(errs, Object.keys(this.options.fields));
  errs = _.pick(errs, function omitRedirects(err) {
    return !err.redirect;
  });
  return errs;
};

Controller.prototype.setErrors = function setErrors(err, req) {
  if (req.form) {
    req.sessionModel.set('errorValues', req.form.values);
  }
  req.sessionModel.set('errors', err);
};

Controller.prototype.locals = function locals(req, res) {
  return {
    baseUrl: req.baseUrl,
    nextPage: this.getNextStep(req, res)
  };
};

Controller.prototype.missingPrereqHandler = function missingPrereqHandler(req, res) {
  var last = _.last(req.sessionModel.get('steps'));
  var redirect = _.first(Object.keys(this.options.steps));

  if (last && this.options.steps[last]) {
    redirect = this.options.steps[last].next || last;
  }
  res.redirect(path.join(req.baseUrl, redirect));
};

Controller.prototype.errorHandler = function errorHandler(err, req, res, next) {
  if (err.code === 'MISSING_PREREQ') {
    this.missingPrereqHandler(req, res, next);
  } else {
    Form.prototype.errorHandler.call(this, err, req, res, next);
  }
};

Controller.Error = ErrorClass;
Controller.validators = Form.validators;
Controller.formatters = Form.formatters;

module.exports = Controller;
