'use strict';

const SessionModel = require('./model');
const _ = require('underscore');

class WizardModel extends SessionModel {
    constructor(attrs, options) {
        options = options || {};
        let journeyModel = options.journeyModel;
        let fields = options.fields;

        if (!journeyModel || !(journeyModel instanceof SessionModel)) {
            throw new Error('wizard-model - journeyModel must be defined');
        }

        if (!fields || typeof fields !== 'object') {
            throw new Error('wizard-model - fields must be defined');
        }

        super(attrs, options);

        journeyModel.registerModel(this);
    }

    getJourneyKeys() {
        return _.pick(
            _.mapObject(this.options.fields, field => field.journeyKey),
            _.isString
        );
    }

    getDefaults() {
        return _.pick(
            _.mapObject(this.options.fields, field => field.default),
            value => value !== undefined
        );
    }

    getSessionData() {
        let defaults = this.getDefaults();
        let wizardData = super.getSessionData();
        let journeyData = _.mapObject(
            this.getJourneyKeys(),
            journeyKey => this.options.journeyModel.get(journeyKey)
        );
        return _.defaults(journeyData, wizardData, defaults);
    }

    resetSessionData() {
        super.resetSessionData();
        // load in journey and defaults after reset
        this.attributes = this.getSessionData();
    }

    updateSessionData(changes) {
        let journeyKeys = this.getJourneyKeys();
        let journeyChanges = {};
        let wizardChanges = {};

        _.each(changes, (value, key) => {
            let journeyKey = journeyKeys[key];
            if (journeyKey) {
                journeyChanges[journeyKey] = value;
            } else {
                wizardChanges[key] = value;
            }
        });

        this.options.journeyModel.set(journeyChanges);
        super.updateSessionData(wizardChanges);
    }
}

module.exports = WizardModel;
