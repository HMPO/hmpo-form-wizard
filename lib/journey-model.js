'use strict';

const SessionModel = require('./model');
const _ = require('underscore');

class JourneyModel extends SessionModel {

    registerModel(model) {
        let modelNames = this.get('registered-models') || [];
        if (!_.contains(modelNames, model.options.key)) {
            modelNames.push(model.options.key);
            this.set('registered-models', modelNames);
        }
        this.currentModels = this.currentModels || [];
        this.currentModels.push(model);
    }

    reset(options) {
        let modelKeys = this.get('registered-models');

        super.reset(options);

        // reset previously registered models
        _.each(modelKeys, modelKey => {
            this.options.req.session[modelKey] = {};
        });

        // reset currently registered models
        _.each(this.currentModels, model => {
            model.reset();
        });
    }

    reload(cb) {
        super.reload(err => {
            if (err) return cb(err);
            _.each(this.currentModels, model => {
                model._reload();
            });
            cb();
        });
    }
}

module.exports = JourneyModel;
