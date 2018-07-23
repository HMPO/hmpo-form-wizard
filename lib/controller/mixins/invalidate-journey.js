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
        if (!changes.length) {
            return;
        }

        let journeyHistory = req.journeyModel.get('history') || [];

        // find the index of the current step in the history
        let path = this.resolvePath(req.baseUrl, req.form.options.route, true);
        let itemIndex = _.findIndex(journeyHistory, { path: path });
        if (itemIndex < 0) {
            return;
        }

        // split changes to wizard and journey changes
        let journeyChanges = [];
        let wizardChanges = [];
        _.each(changes, fieldName => {
            let field = req.form.options.allFields[fieldName];
            if (field && field.journeyKey) {
                journeyChanges.push(field.journeyKey);
            } else {
                wizardChanges.push(fieldName);
            }
        });

        debug('history', journeyHistory);
        debug('journeyChanges', journeyChanges);
        debug('wizardChanges', wizardChanges);

        // find history items to invalidate
        let invalidItems = _.filter(journeyHistory, (item, index) => {
            if (index < itemIndex) {
                return false;
            }
            let matchingJourneyChanges = _.intersection(item.fields, journeyChanges);
            if (!_.isEmpty(matchingJourneyChanges)) {
                return true;
            }

            if (item.wizard !== req.form.options.name) {
                return false;
            }

            let matchingWizardChanges = _.intersection(item.fields, wizardChanges);
            if (!_.isEmpty(matchingWizardChanges)) {
                return true;
            }

            return false;
        });

        if (!_.isEmpty(invalidItems)) {
            _.each(invalidItems, item => item.invalid = true );
            debug('Journey steps invalidated', req.form.options.route, changes, invalidItems);
            req.journeyModel.set('history', journeyHistory);
        }
    }
};
