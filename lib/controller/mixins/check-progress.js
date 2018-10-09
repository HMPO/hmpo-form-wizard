'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:progress-check');

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.checkJourneyProgress);
        this.use(this.checkProceedToNextStep);
    }

    checkJourneyProgress(req, res, next) {
        let path = req.form.options.fullPath;

        if (req.form.options.entryPoint || !req.form.options.checkJourney) {
            debug('Step is allowed by step options', path);
            return next();
        }

        if (req.form.options.reset) {
            this.resetJourneyHistory(req, res);
        }

        let step = this.allowedJourneyStep(req, res, path);
        if (step) {
            debug('Step is allowed next step', path, step.path);
            return next();
        }

        let prereq = this.allowedPrereqStep(req, res, req.form.options.prereqs);
        if (prereq) {
            debug('Step is allowed prereq step', path, prereq.path);
            req.form.options.prereqPath = prereq.path;
            return next();
        }

        debug('Step missing prereq', path);

        let err = new Error('Missing prereq for this step');
        err.code = 'MISSING_PREREQ';
        let lastStep = this.lastAllowedStep(req, res);
        if (lastStep) {
            if (lastStep.invalid) {
                err.redirect = lastStep.path;
                if (!lastStep.revalidate) err.redirect += '?next';
            } else {
                err.redirect = lastStep.next || lastStep.path;
            }
        }

        next(err);
    }

    checkProceedToNextStep(req, res, next) {
        if (typeof req.query.next !== 'string') return next();

        let path = req.form.options.fullPath;

        let step = this.walkJourneyHistory(req, res, step =>
            step.path === path && step.invalid, false);
        if (!step) return next();

        if (step.revalidate) return next();

        this.successHandler(req, res, next);
    }

    walkJourneyHistory(req, res, fn, stopAtInvalid = true, start = null) {
        let seenSteps = new Set;
        let journeyHistory = req.journeyModel.get('history');
        let step = start || _.first(journeyHistory);
        while (step) {
            if (stopAtInvalid && step.invalid) break;
            let next = _.find(journeyHistory, { path: step.next });
            if (next) {
                if (seenSteps.has(next.path)) next = false;
                seenSteps.add(next.path);
            }
            let result = fn.call(this, step, next);
            if (result) return step;
            step = next;
        }
        return false;
    }

    // return completed step specified by path in history flow
    completedJourneyStep(req, res, path) {
        return this.walkJourneyHistory(req, res, step => step.path === path);
    }

    // return step that allows a given path
    allowedJourneyStep(req, res, path) {
        return this.walkJourneyHistory(req, res, step => step.next === path);
    }

    // return first prereq step that matches prereq parts
    allowedPrereqStep(req, res, prereqs) {
        if (!prereqs || !prereqs.length) return false;
        prereqs = _.map(prereqs, prereq => this.resolvePath(req.baseUrl, prereq));
        return this.walkJourneyHistory(req, res, step => prereqs.includes(step.path));
    }

    // return first invalid step or last completed step in flow
    lastAllowedStep(req, res) {
        return this.walkJourneyHistory(req, res, (step, next) => !step.next || !next || step.invalid, false);
    }

    // convert field names to journey field names
    getJourneyFieldNames(req, res, fields, ignoreLocalFields = false, undefinedIfEmpty = false) {
        fields = _.uniq(_.filter(_.map(fields, fieldName => {
            let field = req.form.options.allFields[fieldName];
            if (ignoreLocalFields) return (field && field.journeyKey);
            return (field && field.journeyKey) || fieldName;
        })));
        if (!fields.length && undefinedIfEmpty) return;
        return fields;
    }

    setStepComplete(req, res, path) {
        path = path ? this.resolvePath(req.baseUrl, path, true) : req.form.options.fullPath;

        // alter history to route a prereq to this step
        if (req.form.options.prereqPath) {
            let prereq = this.completedJourneyStep(req, res, req.form.options.prereqPath);
            prereq.next = path;
            this.addJourneyHistoryStep(req, res, prereq);
        }

        let nextStep = this.getNextStepObject(req, res);
        let next = this.resolvePath(req.baseUrl, nextStep.url);
        let continueOnEdit = (nextStep.condition && nextStep.condition.continueOnEdit) || req.form.options.continueOnEdit;

        // save step fields and conditions fields to step history
        let fields = [];
        let formFields = Object.keys(req.form.options.fields);
        fields = fields.concat(formFields);
        fields = fields.concat(nextStep.fields);
        fields = fields.concat(req.form.options.decisionFields);
        formFields = formFields.concat(req.form.options.revalidateIf);

        let newItem = {
            path,
            next,
            fields: this.getJourneyFieldNames(req, res, fields, false, true),
            formFields: this.getJourneyFieldNames(req, res, formFields, false, true),
            wizard: req.form.options.name,
            revalidate: req.form.options.revalidate,
            skip: req.form.options.skip,
            editing: req.isEditing,
            continueOnEdit: req.isEditing ? continueOnEdit :  undefined
        };

        newItem = _.pick(newItem, _.identity);

        this.addJourneyHistoryStep(req, res, newItem);

        debug('Journey step complete', path);
    }

    addJourneyHistoryStep(req, res, step) {
        let journeyHistory = req.journeyModel.get('history') || [];

        let historyIndex = _.findIndex(journeyHistory, { path: step.path });
        let insertIndex = _.findIndex(journeyHistory, { next: step.path });

        if (historyIndex >= 0) {
            journeyHistory.splice(historyIndex, 1, step);
            debug('Journey step updated', step);
        } else if (insertIndex >= 0) {
            journeyHistory.splice(insertIndex + 1, 0, step);
            debug('Journey step inserted', step);
        } else {
            journeyHistory.push(step);
            debug('Journey step added', step);
        }

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
            journeyHistory.splice(historyIndex, 1);
            debug('Journey step removed', path);
            req.journeyModel.set('history', journeyHistory);
        }
    }

    resetJourneyHistory(req, res) {
        debug('Journey reset');
        let journeyHistory = req.journeyModel.get('history') || [];
        journeyHistory = _.filter(journeyHistory, item => item.wizard !== req.form.options.name );
        req.journeyModel.set('history', journeyHistory);
    }
};
