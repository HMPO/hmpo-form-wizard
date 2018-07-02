'use strict';

let formatters = {

    trim(value) {
        return typeof value === 'string' ? value.trim() : value;
    },

    boolean(value) {
        if (value === true || value === 'true') {
            return true;
        } else if (value === false || value === 'false') {
            return false;
        } else {
            return undefined;
        }
    },

    uppercase(value) {
        return typeof value === 'string' ? value.toUpperCase() : value;
    },

    lowercase(value) {
        return typeof value === 'string' ? value.toLowerCase() : value;
    },

    removespaces(value) {
        return typeof value === 'string' ? value.replace(/\s+/g, '') : value;
    },

    singlespaces(value) {
        return typeof value === 'string' ? value.replace(/\s+/g, ' ') : value;
    },

    hyphens(value) {
        return typeof value === 'string' ? value.replace(/[–—-]+/g, '-') : value;
    },

    apostrophes(value) {
        return typeof value === 'string' ? value.replace(/[`‘’]/g, '\'').replace(/[“”]/g, '"') : value;
    },

    quotes(value) {
        return typeof value === 'string' ? value.replace(/[“”]/g, '"') : value;
    },

    removeroundbrackets(value) {
        return typeof value === 'string' ? value.replace(/[()]/g, '') : value;
    },

    removehyphens(value) {
        return typeof value === 'string' ? value.replace(/[–—-]+/g, '') : value;
    },

    removeslashes(value) {
        return typeof value === 'string' ? value.replace(/[/\\]/g, '') : value;
    },

    ukphoneprefix(value) {
        return typeof value === 'string' ? value.replace(/^\+44\(?0?\)?/, '0') : value;
    },

    base64decode(value) {
        return new Buffer(value, 'base64').toString();
    }

};

module.exports = formatters;
