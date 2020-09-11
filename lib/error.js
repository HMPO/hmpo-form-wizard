'use strict';

const debug = require('debug')('hmpo:formerror');

class FormError {
    constructor(key, options, req) {
        options = options || {};
        this.key = key || options.key;
        this.errorGroup = options.errorGroup;
        this.field = options.field;
        this.type = options.type || 'default';
        this.redirect = options.redirect;
        this.url = req && req.path;
        this.message = options.message;
        this.headerMessage = options.headerMessage;

        this.args = {
            [options.type]: Array.isArray(options.arguments) ? options.arguments[0] : options.arguments
        };

        debug('New form error', this);
    }
}

module.exports = FormError;

