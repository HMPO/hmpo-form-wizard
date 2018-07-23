'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:progress-check');

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.checkJourneyProgress);
    }

    checkJourneyProgress(req, res, next) {
        if (req.form.options.entryPoint || !req.form.options.checkJourney) {
            // don't check this step
            return next();
        }

        let path = this.resolvePath(req.baseUrl, req.form.options.route, true);

        if (req.form.options.reset) {
            this.removeJourneyHistoryStep(req, res, path);
        }

        let journeyHistory = req.journeyModel.get('history') || [];

        // only look at steps before a step that has been marked as invalid
        let firstInvalidStep = _.findIndex(journeyHistory, { invalid: true });
        if (firstInvalidStep >= 0) {
            journeyHistory = journeyHistory.slice(0, firstInvalidStep);
        }

        // this is an allowed next step
        let item = _.findWhere(journeyHistory, { next: path });
        if (item) {
            debug('Step is allowed next step', path, item.path);
            return next();
        }

        // this is allowed by a prereq
        let allowedPrereq = _.find(req.form.options.prereqs, prereq => {
            prereq = this.resolvePath(req.baseUrl, prereq);
            return _.findWhere(journeyHistory, { path: prereq });
        });
        if (allowedPrereq) {
            debug('Step is allowed by prereq', path, allowedPrereq);
            return next();
        }

        debug('Step missing prereq', path);

        let err = new Error('Missing prereq for this step');
        err.code = 'MISSING_PREREQ';
        let lastStep = _.last(journeyHistory);
        if (lastStep) {
            err.redirect = lastStep.next || lastStep.path;
        }

        next(err);
    }

    setStepComplete(req, res, path) {
        path = this.resolvePath(req.baseUrl, path || req.form.options.route, true);
        let nextStep = this.getNextStepObject(req, res);
        let next = this.resolvePath(req.baseUrl, nextStep.url);
        let continueOnEdit = (nextStep.condition && nextStep.condition.continueOnEdit) || req.form.options.continueOnEdit;

        // save step fields and conditions fields to step history
        let fields = [];
        fields = fields.concat(Object.keys(req.form.options.fields));
        fields = fields.concat(nextStep.fields);
        fields = fields.concat(req.form.options.decisionFields);
        fields = _.uniq(_.filter(fields));

        // convert field names to journey field names
        if (fields.length) {
            fields = _.map(fields, fieldName => {
                let field = req.form.options.allFields[fieldName];
                return field && field.journeyKey || fieldName;
            });
        } else {
            fields = undefined;
        }

        let newItem = {
            path,
            next,
            wizard: req.form.options.name,
            fields,
            skip: req.form.options.skip,
            continueOnEdit: req.isEditing ? continueOnEdit :  undefined
        };

        this.addJourneyHistoryStep(req, res, newItem);

        debug('Journey step complete', path);
    }

    addJourneyHistoryStep(req, res, step) {
        let journeyHistory = req.journeyModel.get('history') || [];

        let historyIndex = _.findIndex(journeyHistory, { path: step.path });
        let item = journeyHistory[historyIndex];

        let firstInvalidIndex = _.findIndex(journeyHistory, { invalid: true });
        if (firstInvalidIndex < 0) firstInvalidIndex = journeyHistory.length;

        if (item && historyIndex <= firstInvalidIndex) {
            if (step.next === item.next) {
                // route has not changed: replace step
                journeyHistory.splice(historyIndex, 1, step);
            } else {
                // route has changed: truncate and append step
                journeyHistory.splice(historyIndex);
                journeyHistory.push(step);
            }
        } else {
            // step not valid or first invalid: truncate at invalid and append step
            journeyHistory.splice(firstInvalidIndex);
            journeyHistory.push(step);
        }

        debug('Journey step added', step);

        req.journeyModel.set('history', journeyHistory);
    }

    invalidateJourneyHistoryStep(req, res, path) {
        let journeyHistory = req.journeyModel.get('history') || [];

        let historyItem = _.find(journeyHistory, { path });
        if (historyItem) {
            historyItem.invalid = true;
            debug('Journey step marked as invalid at', path);
            req.journeyModel.set('history', journeyHistory);
        }
    }

    removeJourneyHistoryStep(req, res, path) {
        let journeyHistory = req.journeyModel.get('history') || [];

        let historyIndex = _.findIndex(journeyHistory, { path });
        if (historyIndex >= 0) {
            journeyHistory.splice(historyIndex);
            debug('Journey truncated at step', path);
            req.journeyModel.set('history', journeyHistory);
        }
    }
};
