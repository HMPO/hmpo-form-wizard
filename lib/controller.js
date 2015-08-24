var util = require('util'),
    _ = require('underscore'),
    path = require('path'),
    ErrorClass = require('./error'),
    Form = require('hmpo-form-controller');

function Controller() {
    Form.apply(this, arguments);
    this.Error = ErrorClass;
}

util.inherits(Controller, Form);

Controller.prototype.getValues = function (req, res, callback) {
    var json = req.sessionModel.toJSON();
    delete json.errorValues;
    callback(null, _.extend({}, json, req.sessionModel.get('errorValues')));
};

Controller.prototype.saveValues = function (req, res, callback) {
    req.sessionModel.set(req.form.values);
    req.sessionModel.unset('errorValues');
    callback();
};

Controller.prototype.getErrors = function(req, res) {
    var errs = req.sessionModel.get('errors');
    errs = _.pick(errs, Object.keys(this.options.fields));
    errs = _.pick(errs, function (err, key) {
        return !err.redirect;
    });
    return errs;
};

Controller.prototype.setErrors = function(err, req, res) {
    if (req.form) {
        req.sessionModel.set('errorValues', req.form.values);
    }
    req.sessionModel.set('errors', err);
};

Controller.prototype.locals = function (req, res) {
    return {
        baseUrl: req.baseUrl,
        nextPage: this.getNextStep(req, res)
    };
};

Controller.prototype.missingPrereqHandler = function (req, res, next) {
    var last = _.last(req.sessionModel.get('steps')),
        redirect = _.first(Object.keys(this.options.steps));

    if (last && this.options.steps[last]) {
        redirect = this.options.steps[last].next || last;
    }
    res.redirect(path.join(req.baseUrl, redirect));
};

Controller.prototype.errorHandler = function (err, req, res, next) {
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
