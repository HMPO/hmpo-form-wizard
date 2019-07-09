'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:edit-step');

const removeLast = (str, sub) => {
    let index = str.lastIndexOf(sub);
    if (index < 0) return str;
    return str.substr(0, index) + str.substr(index + sub.length);
};

module.exports = Controller => class extends Controller {

    editing(req, res, next) {
        if (!this.options.editable) {
            let urlWithoutEditSuffix = removeLast(req.originalUrl, this.options.editSuffix);
            if (req.originalUrl === urlWithoutEditSuffix) {
                throw new Error('Invalid edit url ' + req.originalUrl);
            }
            debug('this step is not editable, redirecting to non-editstep', urlWithoutEditSuffix);
            return res.redirect(urlWithoutEditSuffix);
        }

        req.isEditing = true;
        res.locals.isEditing = true;
        // editing is run before req.form.options is set, so this must use the controller options
        res.locals.editSuffix = this.options.editSuffix;
        next();
    }

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.checkEditing);
    }

    checkEditing(req, res, next) {
        if (!req.isEditing) this.clearEditing(req, res);
        next();
    }

    clearEditing(req, res) {
        let journeyHistory = req.journeyModel.get('history');
        let changed = _.filter(journeyHistory, item => item.editing && delete item.editing);
        if (changed.length) {
            debug('clearEditing');
            req.journeyModel.set('history', journeyHistory);
        }
    }

    getBackLink(req, res) {
        if (!req.isEditing) {
            return super.getBackLink(req, res);
        }

        let path = req.form.options.fullPath;
        let previousEditStep;
        this.walkJourneyHistory(req, res, step => {
            if (step.path === path) return true;
            if (step.editing) previousEditStep = step;
        });
        if (previousEditStep) {
            return previousEditStep.path + req.form.options.editSuffix;
        }

        return this.resolvePath(req.baseUrl, req.form.options.editBackStep);
    }

    getNextStep(req, res) {
        if (!req.isEditing) {
            return super.getNextStep(req, res);
        }

        if (typeof req.query.next !== 'string') {
            let nextStep = this.getNextStepObject(req, res);

            // if the user should continue in edit mode: continue to next step in edit mode
            if ((nextStep.condition && nextStep.condition.continueOnEdit) || (!nextStep.condition && req.form.options.continueOnEdit)) {
                let nextStepUrl = this.resolvePath(req.baseUrl, nextStep.url);
                if (nextStepUrl.startsWith('/')) nextStepUrl += req.form.options.editSuffix;
                debug('edit journey continuing', nextStepUrl);
                return nextStepUrl;
            }
        }

        // if the edit-back-step is currently allowed to be accessed: go to the edit back step
        let editBackStep = this.resolvePath(req.baseUrl, req.form.options.editBackStep);
        if (this.allowedJourneyStep(req, res, editBackStep)) {
            debug('edit journey returning to edit back step', editBackStep);
            return editBackStep;
        }

        // go to the last step in history in edit mode to allow returning to edit-back-step
        let lastAllowedStep = this.lastAllowedStep(req, res);
        if (lastAllowedStep) {
            let nextStepUrl = lastAllowedStep.invalid || !lastAllowedStep.next ?
                lastAllowedStep.path : lastAllowedStep.next;
            if (nextStepUrl.startsWith('/')) {
                nextStepUrl += req.form.options.editSuffix;
                if (lastAllowedStep.invalid && !lastAllowedStep.revalidate) nextStepUrl += '?next';
            }
            debug('edit journey continuing on last available step', nextStepUrl);
            return nextStepUrl;
        }

        // revert to normal non-edit journey on the next step, user is taken through all steps
        debug('edit journey reverting to normal journey');
        return super.getNextStep(req, res);
    }

};
