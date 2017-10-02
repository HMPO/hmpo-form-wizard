'use strict';

const debug = require('debug')('hmpo:injection');
const JourneyModel = require('./journey-model');
const WizardModel = require('./wizard-model');
const deepCloneMerge = require('deep-clone-merge');
const _ = require('underscore');
const express = require('express');
const bodyParser = require('body-parser');

const DEFAULTS = {
    sessionExists: true,
    journeyName: 'default',
    journeyKeys: {},
    allowedNext: null,
    prereqStep: null,
    featureFlags: null,
    wizardValues: null,
    rawSessionValues: null
};

class SessionInjection {
    inject(req, options) {
        debug('inject');
        if (!req || !req.session) {
            throw new Error('No express session is available in request');
        }

        options = _.extend({}, DEFAULTS, options);

        req.session.exists = options.sessionExists;

        this.setFeatureFlags(req, options.featureFlags);

        this.createJourneyModel(req, options.journeyName);
        this.setJourneyKeys(req, options.journeyKeys);
        this.setNext(req, options.allowedNext);
        this.setPrereq(req, options.prereqStep);

        this.createWizardModels(req, options.wizardValues);

        this.setRawSessionValues(req, options.rawSessionValues);
    }

    setFeatureFlags(req, flags) {
        debug('setFeatureFlags', flags);
        req.session.featureFlags = flags;
    }

    createJourneyModel(req, journeyName) {
        debug('createJourneyModel', journeyName);
        req.journeyModel = new JourneyModel(null, {
            session: req.session,
            key: 'hmpo-journey-' + journeyName
        });
    }

    setJourneyKeys(req, journeyKeys) {
        debug('setJourneyKeys', journeyKeys);
        req.journeyModel.reset();
        req.journeyModel.set(journeyKeys);
    }

    setNext(req, allowedNext) {
        debug('setNext', allowedNext);
        if (allowedNext && !Array.isArray(allowedNext)) {
            allowedNext = [ allowedNext ];
        }
        _.each(allowedNext, next => this.addHistoryStep(req, null, next));
    }

    setPrereq(req, prereqStep) {
        debug('setPrereq', prereqStep);
        if (prereqStep && !Array.isArray(prereqStep)) {
            prereqStep = [ prereqStep ];
        }
        _.each(prereqStep, step => this.addHistoryStep(req, step));
    }

    addHistoryStep(req, path, next) {
        debug('addHistoryStep', path, next);
        let newItem = {
            path: path || '/dummy/path',
            next: next || '/dummy/next',
            wizard: 'session-injection',
            fields: [],
            minor: false,
            skip: false,
            continueOnEdit: false
        };

        let history = req.journeyModel.get('history') || [];
        history.push(newItem);
        req.journeyModel.set('history', history);
    }

    createWizardModels(req, wizards) {
        _.each(wizards, (values, wizardName) => {
            let wizardModel = this.createWizardModel(req, wizardName);
            this.setWizardValues(wizardModel, values);
        });
    }

    createWizardModel(req, wizardName) {
        debug('createWizardModel', wizardName);
        return new WizardModel(null, {
            session: req.session,
            key: 'hmpo-wizard-' + wizardName,
            journeyModel: req.journeyModel,
            fields: {}
        });

    }

    setWizardValues(wizardModel, values) {
        debug('setWizardValues', values);
        wizardModel.reset();
        wizardModel.set(values);
    }

    setRawSessionValues(req, rawSessionValues) {
        debug('setRawSessionValues', rawSessionValues);
        deepCloneMerge.extend(req.session, rawSessionValues);
    }

    middlewareWebform(req, res, next) {
        debug('middlewareWebform');
        res.render('injection');
    }

    middlewareHandler(req, res, next) {
        debug('middlewareHandler', req.body);
        if (req.body) {
            this.inject(req, req.body);
        }
        res.send({
            journeyName: req.journeyModel.name,
            journeyModel: req.journeyModel.toJSON(),
            featureFlags: req.session.featureFlags
        });
    }

    middlewareErrorHandler(err, req, res, next) {
        debug('injectionErrorHandler', err);
        res.send({ error: err });
    }

    middleware() {
        debug('middleware');
        let app = express();
        app.use(bodyParser.json());
        app.get('*', this.middlewareWebform);
        app.post('*', this.middlewareHandler);
        app.use(this.middlewareErrorHandler);
        return app;
    }
}

module.exports = SessionInjection;
