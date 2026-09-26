'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:invalidate-task');

module.exports = Controller => class extends Controller {

    middlewareActions() {
        super.middlewareActions();

        this.use(this.invalidateTask);
    }

    invalidateTask(req, res, next) {
        let invalidatingFields = this._getInvalidatingFields(req);

        if (_.isEmpty(invalidatingFields)) return next();

        debug('Task-invalidating fields', Object.keys(invalidatingFields));

        _.each(invalidatingFields, (rules, fieldName) => this._bindFieldInvalidation(req, fieldName, rules));

        next();
    }

    successHandler(req, res, next) {
        // when editing and a task invalidation fired, redirect to the invalidated step
        // (or hub) instead of returning to the editBackStep (check-your-answers)
        if (req.isEditing && req._taskInvalidated) {
            let redirectPath = this._getTaskInvalidatedRedirect(req);
            if (redirectPath) {
                debug('Task invalidated during edit, redirecting to', redirectPath);
                this.setStepComplete(req, res);
                return res.redirect(redirectPath);
            }
        }
        return super.successHandler(req, res, next);
    }

    _getTaskInvalidatedRedirect(req) {
        // prefer explicit redirectTo from the rule that fired
        if (req._taskInvalidatedRedirect) {
            return this.resolvePath(req.baseUrl, req._taskInvalidatedRedirect);
        }
        // fallback to the hub step (task-list)
        return this._findHubPath(req);
    }

    _getInvalidatingFields(req) {
        return _.pick(
            _.mapObject(req.form.options.fields, field => field.invalidatesTask),
            rules => rules && rules.length
        );
    }

    _bindFieldInvalidation(req, fieldName, rules) {
        req.sessionModel.on('change:' + fieldName, () => {
            let newValue = req.sessionModel.get(fieldName);
            _.each(rules, rule => this._applyRuleIfMatched(req, fieldName, newValue, rule));
        });
    }

    _applyRuleIfMatched(req, fieldName, newValue, rule) {
        if (!this._ruleMatches(req, newValue, rule)) return;

        debug('Invalidating task because field changed', fieldName, '=', newValue, '-> clearing', rule.taskFlag);

        this._markTaskInvalidated(req, rule);
        this._clearRuleTargets(req, rule);
    }

    _ruleMatches(req, newValue, rule) {
        if (!this._isTriggeredValue(rule, newValue)) return false;
        return this._conditionMatches(req, rule.condition);
    }

    _isTriggeredValue(rule, newValue) {
        return Array.isArray(rule.values) && rule.values.includes(newValue);
    }

    _conditionMatches(req, condition) {
        if (!condition) return true;
        let conditionValue = req.sessionModel.get(condition.field);
        return Array.isArray(condition.values) && condition.values.includes(conditionValue);
    }

    _markTaskInvalidated(req, rule) {
        req._taskInvalidated = true;
        if (rule.redirectTo) {
            req._taskInvalidatedRedirect = rule.redirectTo;
        }
    }

    _clearRuleTargets(req, rule) {
        if (rule.taskFlag) {
            req.sessionModel.unset(rule.taskFlag);
        }

        if (Array.isArray(rule.fields) && rule.fields.length) {
            req.sessionModel.unset(rule.fields);
        }
    }

    _findHubPath(req) {
        let steps = req.form.options.steps;
        let hubRoute = _.findKey(steps, step => step.hub);
        if (hubRoute) {
            return this.resolvePath(req.baseUrl, hubRoute.replace(/^\//, ''));
        }
    }

};
