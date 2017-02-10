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
        changes = _.keys(_.omit(changes, 'csrf-secret'));
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

        let historyIndex = _.findIndex(journeyHistory, (item, index) => {
            if (index < itemIndex) {
                return false;
            }
            return !_.isEmpty(_.intersection(item.fields, changes));
        });
        if (historyIndex < 0) {
            return;
        }

        let invalidated = journeyHistory.splice(historyIndex);
        debug('Journey truncated', req.form.options.route, changes, invalidated[0]);
        req.journeyModel.set('history', journeyHistory);
    }
};
