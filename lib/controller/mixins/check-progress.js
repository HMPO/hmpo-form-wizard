'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:progress-check');

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.checkJourneyProgress);
    }

    checkJourneyProgress(req, res, next) {
        if (this.options.entryPoint || !this.options.checkJourney) {
            // don't check this step
            return next();
        }

        let path = this.resolvePath(req.baseUrl, this.options.route, true);

        if (this.options.reset) {
            this.removeJourneyHistoryStep(req, res, path);
        }

        let journeyHistory = req.journeyModel.get('history') || [];

        // this is an allowed next step
        let item = _.findWhere(journeyHistory, { next: path });
        if (item) {
            debug('Step is allowed next step', path, item.path);
            return next();
        }

        // this is allowed by a prereq
        let allowedPrereq = _.find(this.options.prereqs, prereq => {
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
        path = this.resolvePath(req.baseUrl, path || this.options.route, true);
        let nextStep = this.getNextStepObject(req, res);
        let next = this.resolvePath(req.baseUrl, nextStep.url);
        let continueOnEdit = (nextStep.condition && nextStep.condition.continueOnEdit) || this.options.continueOnEdit;

        let newItem = {
            path,
            next,
            fields: nextStep.fields && nextStep.fields.length ? nextStep.fields : undefined,
            skip: this.options.skip,
            continueOnEdit: req.isEditing ? continueOnEdit :  undefined
        };

        this.addJourneyHistoryStep(req, res, newItem);

        debug('Journey step complete', path);
    }

    addJourneyHistoryStep(req, res, step) {
        let journeyHistory = req.journeyModel.get('history') || [];

        let historyIndex = _.findIndex(journeyHistory, { path: step.path });
        let item = journeyHistory[historyIndex];
        if (item && step.next === item.next) {
            // replace step
            journeyHistory.splice(historyIndex, 1, step);
        } else {
            if (item) {
                // truncate
                journeyHistory.splice(historyIndex);
            }

            // append step
            journeyHistory.push(step);
        }

        debug('Journey step added', step);

        req.journeyModel.set('history', journeyHistory);
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
