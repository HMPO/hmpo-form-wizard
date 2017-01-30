'use strict';

const _ = require('underscore');

module.exports = Controller => class extends Controller {

    editing(req, res, next) {
        req.isEditing = true;
        res.locals.isEditing = true;
        res.locals.editSuffix = this.options.editSuffix;
        next();
    }

    getBackLink(req, res) {
        let backLink = super.getBackLink(req, res);

        if (!req.isEditing) {
            return backLink;
        }

        let previousStep = _.find(req.journeyModel.get('history'), { path: backLink });
        if (previousStep && previousStep.continueOnEdit) {
            return backLink + this.options.editSuffix;
        }

        return this.resolvePath(req.baseUrl, this.options.editBackStep);
    }

    getNextStep(req, res) {
        if (!req.isEditing) {
            return super.getNextStep(req, res);
        }

        let nextStep = this.getNextStepObject(req, res);

        if (nextStep.url) {
            if ((nextStep.condition && nextStep.condition.continueOnEdit) || (!nextStep.condition && this.options.continueOnEdit)) {
                return this.resolvePath(req.baseUrl, nextStep.url + this.options.editSuffix);
            }
        }

        return this.resolvePath(req.baseUrl, this.options.editBackStep);
    }

};
