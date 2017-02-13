'use strict';

const _ = require('underscore');

module.exports = Controller => class extends Controller {

    editing(req, res, next) {
        req.isEditing = true;
        res.locals.isEditing = true;
        res.locals.editSuffix = req.form.options.editSuffix;
        next();
    }

    getBackLink(req, res) {
        let backLink = super.getBackLink(req, res);

        if (!req.isEditing) {
            return backLink;
        }

        let previousStep = _.find(req.journeyModel.get('history'), { path: backLink });
        if (previousStep && previousStep.continueOnEdit) {
            return backLink + req.form.options.editSuffix;
        }

        return this.resolvePath(req.baseUrl, req.form.options.editBackStep);
    }

    getNextStep(req, res) {
        if (!req.isEditing) {
            return super.getNextStep(req, res);
        }

        let nextStep = this.getNextStepObject(req, res);

        if (nextStep.url) {
            if ((nextStep.condition && nextStep.condition.continueOnEdit) || (!nextStep.condition && req.form.options.continueOnEdit)) {
                return this.resolvePath(req.baseUrl, nextStep.url + req.form.options.editSuffix);
            }
        }

        return this.resolvePath(req.baseUrl, req.form.options.editBackStep);
    }

};
