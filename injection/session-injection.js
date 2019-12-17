'use strict';

const debug = require('debug')('hmpo:injection');
const JourneyModel = require('../lib/journey-model');
const WizardModel = require('../lib/wizard-model');
const _ = require('underscore');
const express = require('express');
const bodyParser = require('body-parser');
const JSON5 = require('json5');

const fs = require('fs');
const path = require('path');
const templateHtml = fs.readFileSync(path.join(__dirname, 'injection.html'), 'utf8');
const template = _.template(templateHtml);

const DEFAULTS = {
    sessionExists: true,
    journeyName: 'default',
    journeyKeys: null,
    allowedStep: null,
    prereqStep: null,
    featureFlags: null,
    wizardValues: null,
    rawSessionValues: null,
    enumeratedDistribution: null
};

const EXAMPLE = {
    'journeyName': 'name',
    'journeyKeys': {
        'key': 'name'
    },
    'allowedStep': '/full/path',
    'prereqStep': '/full/path',
    'featureFlags': {
        'flag': true
    },
    'wizards': {
        'wizardName': {
            'wizardKey': 'value'
        }
    },
    'rawSessionValues': {
        'sessionKey': 'value'
    },
    'enumeratedDistribution': {
        'ABJourney': {
            'probability': {
                'A': 10,
                'B': 90
            }
        }
    }
};

const toJSON = v => typeof v === 'string' ? v : JSON5.stringify(v, null, 2);

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
        this.setNext(req, options.allowedStep);
        this.setPrereq(req, options.prereqStep);

        this.createWizardModels(req, options.wizardValues);

        this.setRawSessionValues(req, options.rawSessionValues);

        this.setEnumeratedDistributions(req, options.enumeratedDistribution);
    }

    setFeatureFlags(req, flags) {
        debug('setFeatureFlags', flags);
        if (flags) {
            req.session.featureFlags = _.extend({}, flags);
        }
    }

    createJourneyModel(req, journeyName) {
        debug('createJourneyModel', journeyName);
        req.journeyModel = new JourneyModel(null, {
            req,
            key: 'hmpo-journey-' + journeyName
        });
    }

    setJourneyKeys(req, journeyKeys) {
        debug('setJourneyKeys', journeyKeys);
        if (journeyKeys) {
            req.journeyModel.reset();
            req.journeyModel.set(journeyKeys);
        }
    }

    setNext(req, allowedStep) {
        debug('setNext', allowedStep);
        if (allowedStep && !Array.isArray(allowedStep)) {
            allowedStep = [ allowedStep ];
        }
        _.each(allowedStep, next => this.addHistoryStep(req, null, next));
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
            req,
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
        if (rawSessionValues) {
            debug('setRawSessionValues', rawSessionValues);
            _.forEach(rawSessionValues, (val, key) => req.session[key] = val);
        }
    }

    setEnumeratedDistributions(req, enumeratedDistributions) {
        debug('setEnumeratedDistributions', enumeratedDistributions);
        if (enumeratedDistributions) {
            req.session.enumeratedDistribution = _.extend({}, enumeratedDistributions);
        }
    }

    middlewareDecodePayload(req, res, next) {
        debug('middlewareDecodePayload');

        let payload;

        if (req.query && req.query.payload !== undefined) {
            payload = req.query.payload || null;
        } else if (req.body && req.body.payload !== undefined) {
            payload = req.body.payload || null;
        } else if (!_.isEmpty(req.body)) {
            payload = req.body;
        }

        if (typeof payload === 'string') {
            try {
                payload = JSON5.parse(payload);
            } catch (err) {
                res.locals.payload = payload;
                return next(err);
            }
        }

        req.payload = payload;

        next();
    }

    middlewareHandler(req, res, next) {
        debug('middlewareHandler');

        if (req.payload) {
            this.inject(req, req.payload);
            res.locals.notice = 'Payload injected';
            res.locals.payload = req.payload;
            req.session.lastInjectionPayload = req.payload;
        } else {
            if (req.payload === null) req.session.lastInjectionPayload = null;
            let journeyName = req.session.lastInjectionPayload && req.session.lastInjectionPayload.journeyName;
            this.createJourneyModel(req, journeyName || 'default');
        }

        if (!res.locals.payload) {
            res.locals.payload = req.session.lastInjectionPayload;
        }

        res.locals.featureFlags = req.session.featureFlags;
        res.locals.enumeratedDistribution = req.session.enumeratedDistribution;
        res.locals.journeyKeys = _.omit(req.journeyModel.toJSON(), 'history', 'registered-models');

        this.middlewareRender(req, res, next);
    }

    middlewareErrorHandler(err, req, res, next) {
        debug('injectionErrorHandler', err);
        res.locals.notice = 'Error: '+ err.message;
        this.middlewareRender(req, res, next);
    }

    middlewareRender(req, res, next) {
        if (req.accepts('html')) {
            res.locals.payload = toJSON(res.locals.payload || EXAMPLE);
            res.locals.journeyKeys = toJSON(res.locals.journeyKeys);
            res.locals.featureFlags = toJSON(res.locals.featureFlags);
            res.locals.enumeratedDistribution = toJSON(res.locals.enumeratedDistribution);
            res.type('html');
            return res.send(template(res.locals));
        }

        let currentStatus = _.pick(res.locals, 'featureFlags', 'journeyKeys', 'payload', 'enumeratedDistribution');
        if (req.accepts('json')) {
            res.type('json');
            return res.send(currentStatus);
        }

        res.type('txt');
        return res.send(toJSON(currentStatus));
    }

    middleware() {
        debug('middleware');
        let app = express();
        app.use(
            bodyParser.json(),
            bodyParser.urlencoded({ extended: true }),
            this.middlewareDecodePayload.bind(this),
            this.middlewareHandler.bind(this));
        app.use(this.middlewareErrorHandler.bind(this));
        return app;
    }
}

module.exports = SessionInjection;
