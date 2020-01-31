'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:invalidate-journey');

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.checkJourneyInvalidations);
    }

    checkJourneyInvalidations(req, res, next) {
        req.sessionModel.on('change', changes => this._invalidateJourney(req, res, changes));
        next();
    }

    // invalidate steps after this step where fields were used in branching conditions
    _invalidateJourney(req, res, changes) {
        changes = _.keys(_.omit(changes, ['csrf-secret', 'errors', 'errorValues']));
        if (!changes || !changes.length) return;

        let path = req.form.options.fullPath;

        debug('invalidateJourney', path, changes);

        let cleanSteps = new Set;
        this.walkJourneyHistory(req, res, step => {
            if (step.path === path) return true;
            cleanSteps.add(step.path);
        }, false);

        let invalidate = (step, changes) => {
            let matches = _.intersection(step.fields, changes);
            if (matches.length) {
                debug('invalidateJourney invalidated decision fields', step.path, matches);
                step.invalid = true;
            }

            matches = _.intersection(step.formFields, changes);
            if (matches.length) {
                debug('invalidateJourney invalidated form fields', step.path, matches);
                step.invalid = true;
                step.revalidate = true;
            }
        };

        let journeyChanges = this.getJourneyFieldNames(req, res, changes, true);
        journeyChanges.push('*');

        let wizardChanges = this.getJourneyFieldNames(req, res, changes);

        let journeyHistory = req.journeyModel.get('history');
        _.each(journeyHistory, step => {
            if (cleanSteps.has(step.path)) return;

            invalidate(step, journeyChanges);
            if (step.wizard === req.form.options.name) {
                invalidate(step, wizardChanges);
            }
        });
        req.journeyModel.set('history', journeyHistory);
    }
};
