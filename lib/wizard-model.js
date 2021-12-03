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
        let journeyData = _.omit(_.mapObject(
            this.getJourneyKeys(),
            journeyKey => this.options.journeyModel.get(journeyKey)
        ), _.isUndefined);
        return Object.assign({}, defaults, wizardData, journeyData);
    }

    resetSessionData() {
        super.resetSessionData();
        this._reload();
    }

    updateSessionData(changes) {
        const journeyKeys = this.getJourneyKeys();
        const journeyChanges = Object.create(null);
        const wizardChanges = Object.create(null);

        _.each(changes, (value, key) => {
            if (Object.prototype.hasOwnProperty.call(journeyKeys, key)) {
                journeyChanges[journeyKeys[key]] = value;
            } else {
                wizardChanges[key] = value;
            }
        });

        this.options.journeyModel.set(journeyChanges);
        super.updateSessionData(wizardChanges);
    }

    reload(cb) {
        this.options.journeyModel.reload(cb);
    }
}

module.exports = WizardModel;
