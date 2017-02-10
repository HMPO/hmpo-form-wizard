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

    _defaultConditionFunction(req, res, condition) {
        let val = req.sessionModel.get(condition.field);
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
        default:
            return val === condition.value;
        }
    }

    decodeConditions(req, res, nextStep) {
        let fieldsUsed = [];
        let successfulCondition = null;
        while (_.isArray(nextStep)) {
            let conditions = nextStep;
            nextStep = null;
            _.find(conditions, condition => {
                if (typeof condition === 'string') {
                    nextStep = condition;
                    return true;
                }

                let fn = condition.fn || this._defaultConditionFunction;

                if (condition.field) {
                    fieldsUsed.push(condition.field);
                }

                if (fn.call(this, req, res, condition)) {
                    nextStep = condition.next;
                    successfulCondition = condition;
                    return true;
                }
            });
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
        let nextStep = this.getNextStepObject(req, res);

        if (nextStep.url) {
            return this.resolvePath(req.baseUrl, nextStep.url);
        }

        return this.resolvePath(req.baseUrl, req.form.options.route, true);
    }

    getErrorStep(err, req, res) {
        let allErrorsHaveRedirects = _.every(err, error => error.redirect);

        if (allErrorsHaveRedirects) {
            let redirect = _.find(err, error => error.redirect).redirect;
            return this.resolvePath(req.baseUrl, redirect);
        }

        return this.resolvePath(req.baseUrl, req.path, true);
    }

};
