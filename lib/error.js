'use strict';

var util = require('util');
var _ = require('underscore');
var i18nLookup = require('i18n-lookup');
var Controller = require('hmpo-form-controller');

function getArgs(type, args) {
  if (type === 'past') {
    return {age: args.join(' ')};
  } else if (_.isArray(args) && typeof type === 'string') {
    var obj = {};
    obj[type] = args[0];
    return obj;
  }
  return {};
}

function compile(t, context) {
  return require('hogan.js').compile(t).render(context);
}

function FormError(key, options, req) {
  req = req || {};
  if (typeof req.translate === 'function') {
    this.translate = req.translate;
  }
  Controller.Error.apply(this, arguments);
}

util.inherits(FormError, Controller.Error);

FormError.prototype.getMessage = function getValidationMessage(key, options, req, res) {
  res = res || {};
  var keys = [
    'validation.' + key + '.' + options.type,
    'validation.' + key + '.default',
    'validation.' + options.type,
    'validation.default'
  ];
  var context = _.extend({
    label: this.translate('fields.' + key + '.label').toLowerCase()
  }, res.locals, getArgs(options.type, options.arguments));

  return i18nLookup(this.translate, compile)(keys, context);
};

FormError.prototype.translate = _.identity;

module.exports = FormError;
