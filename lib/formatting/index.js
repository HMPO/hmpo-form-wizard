'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:formatting');
const formatters = require('./formatters');

function applyFormatters(fieldFormatters, key, value) {
    if (!Array.isArray(fieldFormatters)) {
        fieldFormatters = [ fieldFormatters ];
    }
    _.each(fieldFormatters, formatter => {
        if (typeof formatter === 'string') {
            formatter = formatters[formatter];
        }
        if (typeof formatter === 'function') {
            debug('Formatting field %s value %s with formatter %s', key, value, formatter.name);
            value = formatter(value);
        }
    });
    return value;
}

function format(fields, key, value, defaultFormatters) {
    let field = fields[key];
    if (!Array.isArray(value)) {
        value = [ value ];
    }

    // default values to an empty string
    value = value.map(item => item || '');

    // apply default formatters first
    if (defaultFormatters && !(field && field['ignore-defaults'])) {
        debug('Formatting field %s with default formatters:', key, defaultFormatters);
        value = value.map(item => applyFormatters(defaultFormatters, key, item));
    }

    // apply configured formatters
    if (field && field.formatter) {
        debug('Formatting field %s with formatters:', key, field.formatter);
        value = value.map(item => applyFormatters(field.formatter, key, item));
    }

    if (value.length === 1) return value[0];
    return value;
}

module.exports = {
    formatters,
    format
};
