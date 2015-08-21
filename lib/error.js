var util = require('util'),
    _ = require('underscore'),
    i18nLookup = require('i18n-lookup'),
    Controller = require('hmpo-form-controller');

function getArgs(type, args) {
    if (type === 'maxlength') {
        return { maxlength: args[0] };
    } else if (type === 'minlength') {
        return { minlength: args[0] };
    } else if (type === 'exactlength') {
        return { exactlength: args[0] };
    } else if (type === 'past') {
        return { age: args.join(' ') };
    } else {
        return {};
    }
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

FormError.prototype.getMessage = function getValidationMessage(key, options) {
    var keys = [
            'validation.' + key + '.' + options.type,
            'validation.' + key + '.default',
            'validation.' + options.type,
            'validation.default'
        ],
        context = _.extend({
            label: this.translate('fields.' + key + '.label').toLowerCase()
        }, getArgs(options.type, options.arguments));

    return i18nLookup(this.translate, compile)(keys, context);
};

FormError.prototype.translate = _.identity;

module.exports = FormError;
