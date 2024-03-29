'use strict';

const _ = require('underscore');
const moment = require('moment');

module.exports = Controller => class extends Controller {

    _decodeDateString(str) {
        if (!str) {
            return moment().startOf('day');
        }
        str = String(str);
        if (/^\d{4}-\d\d-\d\d$/.test(str)) {
            return moment(str, 'YYYY-MM-DD');
        }

        let date = moment().startOf('day');
        let direction = /\s+ago$/.test(str) ? 'subtract' : 'add';
        let reInterval = /(-?\d+)\s*(days?|months?|years?|)/g;
        let match = reInterval.exec(str);
        while (match) {
            let interval = parseInt(match[1], 10);
            let unit = match[2] || 'y';
            date[direction](interval, unit);
            match = reInterval.exec(str);
        }

        return date;
    }

    _getConditionFieldNames(fieldNames) {
        if (typeof fieldNames == 'string') return fieldNames;
        const fields = Object.create(null);

        const getFieldNames = fieldName => {
            if (typeof fieldName === 'string') {
                fields[fieldName] = fieldName;
            } else if (_.isArray(fieldName)) {
                fieldNames.forEach(getFieldNames);
            } else {
                Object.assign(fields, fieldName);
            }
        };

        getFieldNames(fieldNames);

        return fields;
    }

    _getConditionValue(req, fieldNames) {
        if (!fieldNames) return undefined;
        if (typeof fieldNames == 'string') {
            return req.sessionModel.get(fieldNames);
        }
        return _.mapObject(fieldNames, attr => req.sessionModel.get(attr));
    }

    _defaultConditionFunction(req, res, condition) {
        let fields;

        if (condition.field) {
            fields = this._getConditionFieldNames(condition.field);
        } else if (typeof condition.value === 'object') {
            fields = this._getConditionFieldNames(Object.keys(condition.value));
        }

        let val = this._getConditionValue(req, fields);

        if (typeof condition.op === 'function') {
            return condition.op.call(this, val, req, res, condition);
        }

        let date;

        switch (condition.op) {
        case '>':
            return val > condition.value;
        case '>=':
            return val >= condition.value;
        case '<':
            return val < condition.value;
        case '<=':
            return val <= condition.value;
        case '==':
            return val == condition.value;
        case '!=':
            return val != condition.value;
        case 'before':
            date = this._decodeDateString(condition.value);
            return moment(val, 'YYYY-MM-DD').isBefore(date);
        case 'after':
            date = this._decodeDateString(condition.value);
            return moment(val, 'YYYY-MM-DD').isAfter(date);
        case 'in':
            return _.contains(condition.value, val);
        case 'all':
            return _.all(val, (val, name) => val === condition.value[name]);
        case 'some':
            return _.some(val, (val, name) => val === condition.value[name]);
        default:
            return val === condition.value;
        }
    }

    decodeConditions(req, res, nextStep) {
        const fieldsUsed = [];
        let successfulCondition = null;
        while (_.isArray(nextStep)) {
            let conditions = nextStep;
            nextStep = null;
            _.find(conditions, condition => {
                if (typeof condition === 'string' || typeof condition === 'function') {
                    nextStep = condition;
                    return true;
                }

                let fn = condition.fn || this._defaultConditionFunction;

                if (condition.field) {
                    let fields = this._getConditionFieldNames(condition.field);
                    fieldsUsed.push(typeof fields === 'string' ? fields : _.values(fields));
                } else if (typeof condition.value === 'object') {
                    let fields = this._getConditionFieldNames(Object.keys(condition.value));
                    fieldsUsed.push(_.values(fields));
                }

                if (typeof fn === 'string') {
                    if (typeof this[fn] !== 'function') {
                        throw new Error('Tried to run nonexistant condition controller method: ' + fn);
                    }
                    fn = this[fn];
                }

                let result = fn.call(this, req, res, condition);
                if (condition.not) result = !result;
                if (result) {
                    nextStep = condition.next;
                    successfulCondition = condition;
                    return true;
                }
            });
        }

        if (typeof nextStep === 'function') {
            nextStep = nextStep.call(this, req, res, successfulCondition);
        }

        return {
            url: nextStep,
            condition: successfulCondition,
            fields: _.uniq(_.filter(_.flatten(fieldsUsed)))
        };
    }

    getNextStepObject(req, res) {
        return this.decodeConditions(req, res, req.form.options.next);
    }

    getNextStep(req, res) {
        const nextStep = this.getNextStepObject(req, res);

        if (nextStep.url) {
            return this.resolvePath(req.baseUrl, nextStep.url);
        }

        return req.form.options.fullPath;
    }

    getErrorStep(err, req, res) {
        const allErrorsHaveRedirects = _.every(err, error => error.redirect);

        if (allErrorsHaveRedirects) {
            let redirect = _.find(err, error => error.redirect).redirect;
            return this.resolvePath(req.baseUrl, redirect);
        }

        return req.originalUrl;
    }

};
