'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:formatting');
const formatters = require('./formatters');

function applyFormatters(fieldFormatters, key, value, context) {
    if (!Array.isArray(fieldFormatters)) {
        fieldFormatters = [ fieldFormatters ];
    }
    _.each(fieldFormatters, formatter => {
        if (typeof formatter === 'string') formatter = { type: formatter };
        if (typeof formatter === 'function') formatter = { fn: formatter };

        if (typeof formatter.fn !== 'function') {
            formatter.fn = formatters[formatter.type];
        }

        if (typeof formatter.fn === 'function') {
            formatter.type = formatter.type || formatter.fn.name;

            if (formatter.arguments === undefined) {
                formatter.arguments = [];
            } else if (!_.isArray(formatter.arguments)) {
                formatter.arguments = [ formatter.arguments ];
            }

            debug('Applying %s formatter to %s with value "%s"', formatter.type, key, value, formatter.arguments);
            value = formatter.fn.apply(context, [value].concat(formatter.arguments));
        }
    });
    return value;
}

function format(fields, key, value, defaultFormatters, context) {
    let field = fields[key];
    if (!Array.isArray(value)) {
        value = [ value ];
    } else if (!field.multiple) {
        value = value.slice(0, 1);
    }

    // default values to an empty string
    value = value.map(item => item || '');

    // apply default formatters first
    if (defaultFormatters && !(field && field['ignore-defaults'])) {
        debug('Formatting field %s with default formatters:', key, defaultFormatters);
        value = value.map(item => applyFormatters(defaultFormatters, key, item, context));
    }

    // apply configured formatters
    if (field && field.formatter) {
        debug('Formatting field %s with formatters:', key, field.formatter);
        value = value.map(item => applyFormatters(field.formatter, key, item, context));
    }

    if (!field.multiple) return value[0];
    return value;
}

module.exports = {
    formatters,
    format
};
