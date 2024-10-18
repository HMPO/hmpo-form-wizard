'use strict';

const moment = require('moment');
const _ = require('underscore');

// validator methods should return false (or falsy value) for *invalid* input
// and true (or truthy value) for *valid* input.

const dateFormat = 'YYYY-MM-DD';

let validators = {

    string(value) {
        return typeof value === 'string';
    },

    regex(value, match) {
        return validators.string(value) && !!value.match(match);
    },

    required(value) {
        return value !== undefined && value !== '';
    },

    email(value) {
        return value === '' || validators.regex(value, /^[a-z0-9._%+-]+@([a-z0-9]+([a-z0-9-]*[a-z0-9]+)?\.)+[a-z]{2,6}$/i);
    },

    minlength(value, length) {
        length = length || 0;
        return validators.string(value) && (value === '' || value.length >= length);
    },

    maxlength(value, length) {
        return validators.string(value) && (value === '' || value.length <= length);
    },

    maxwords(text, length) {
        if (!validators.string(text)) return false;
        const words = text.match(/\S+/g) || [];
        return words.length <= length;
    },

    exactlength(value, length) {
        return validators.string(value) && (value === '' || value.length === length);
    },

    alpha(value) {
        return validators.regex(value, /^[a-zA-Z]*$/);
    },

    alphaex(value) {
        return validators.regex(value, /^[a-zA-Z .,'-]*$/);
    },

    alphaex1(value) {
        return validators.regex(value, /^[a-zA-Z '-]*$/);
    },

    alphanum(value) {
        return validators.regex(value, /^[a-zA-Z0-9]*$/);
    },

    alphanumex(value) {
        return validators.regex(value, /^[a-zA-Z0-9 .,'-]*$/);
    },

    alphanumex1(value) {
        return validators.regex(value, /^[a-zA-Z0-9 .,'&/-]*$/);
    },

    numeric(value) {
        return validators.regex(value, /^\d*$/);
    },

    equal(value) {
        let values = [].slice.call(arguments, 1);
        if (!Array.isArray(value)) {
            value = [value];
        }
        return values.length && _.every(value, item => {
            return item === '' || values.indexOf(item) > -1;
        });
    },

    phonenumber(value) {
        return value === '' || validators.regex(value, /^\(?\+?[\d()-]{0,15}$/);
    },

    ukmobilephone(value) {
        return value === '' || validators.regex(value, /^(07)\d{9}$/);
    },

    date(value) {
        return value === '' || validators.regex(value, /\d{4}-\d{2}-\d{2}/) && moment(value, dateFormat).isValid();
    },

    'date-year': function dateyear(value) {
        return value === '' || validators.regex(value, /^\d{4}$/);
    },

    'date-month': function datemonth(value) {
        return value === '' || (
            validators.regex(value, /^\d{2}$/) && parseInt(value, 10) > 0 && parseInt(value, 10) < 13
        );
    },

    'date-day': function dateday(value) {
        return value === '' || (
            validators.regex(value, /^\d{2}$/) && parseInt(value, 10) > 0 && parseInt(value, 10) < 32
        );
    },

    before(value, date) {
        let test = moment(value, dateFormat);
        let comparator;
        if (arguments.length === 2 && validators.date(date)) {
            comparator = date;
        } else {
            comparator = moment();
            let args = [].slice.call(arguments, 1);
            let diff, unit;
            while (args.length) {
                diff = args.shift();
                unit = args.shift() || 'years';
                test = test.add(diff, unit);
            }
        }
        return value === '' || validators.date(value) && test.isBefore(comparator);
    },

    after(value, date) {
        let test = moment(value, dateFormat);
        let comparator;
        if (arguments.length === 2 && validators.date(date)) {
            comparator = date;
        } else {
            comparator = moment();
            let args = [].slice.call(arguments, 1);
            let diff, unit;
            while (args.length) {
                diff = args.shift();
                unit = args.shift() || 'years';
                test = test.add(diff, unit);
            }
        }
        return value === '' || validators.date(value) && test.isAfter(comparator);
    },

    postcode(value) {
        return value === '' || validators.regex(value, /^([A-Z][1-9][0-9]?|[A-Z][A-HJ-Y][1-9]?[0-9]|[A-Z][1-9][A-Z]|[A-Z][A-HJ-Y][1-9][A-Z]) ?[0-9][A-Z]{2}$/i);
    },

    match(value, fieldName, fromSession) {
        let otherValue =   fromSession ? this.sessionModel.get(fieldName) : this.values[fieldName];
        return value === '' || (value === otherValue);
    },

    beforeField(value, fieldName, fromSession) {
        let otherValue =   fromSession ? this.sessionModel.get(fieldName) : this.values[fieldName];
        return validators.before.call(this, value, otherValue || '');
    },

    afterField(value, fieldName, fromSession) {
        let otherValue =   fromSession ? this.sessionModel.get(fieldName) : this.values[fieldName];
        return validators.after.call(this, value, otherValue || '');
    }
};

module.exports = validators;
