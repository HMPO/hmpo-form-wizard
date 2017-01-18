'use strict';

const _ = require('underscore');
const path = require('path');
const ErrorClass = require('../error');
const Form = require('hmpo-form-controller');

class BaseController extends Form {
    constructor(options) {
        if (!options.route) {
            throw new Error('A route must be specified');
        }
        // default template is the same as the pathname
        options.template = options.template || options.route.replace(/^\//, '') || 'index';
        if (options.templatePath) {
            options.template = path.join(options.templatePath, options.template);
        }

        super(options);

        this.Error = ErrorClass;
    }

    getValues(req, res, callback) {
        let json = req.sessionModel.toJSON();
        delete json.errorValues;
        let errorValues = req.sessionModel.get('errorValues');
        errorValues = _.pick(errorValues, Object.keys(this.options.fields));
        callback(null, _.extend(json, errorValues));
    }

    saveValues(req, res, callback) {
        req.sessionModel.set(req.form.values);
        req.sessionModel.unset('errorValues');
        callback();
    }

    getErrors(req, res) {
        let errs = req.sessionModel.get('errors');
        errs = _.pick(errs, Object.keys(this.options.fields));
        errs = _.pick(errs, err => !err.redirect );
        return errs;
    }

    setErrors(err, req, res) {
        if (req.form) {
            req.sessionModel.set('errorValues', req.form.values);
        }
        req.sessionModel.set('errors', err);
    }

    locals(req, res) {
        return {
            baseUrl: req.baseUrl,
            nextPage: this.getNextStep(req, res)
        };
    }

    missingPrereqHandler(req, res, next) {
        // TODO: objects keys order is undefined
        let last = _.last(req.sessionModel.get('steps'));

        // TODO: objects keys order is undefined
        let redirect = _.first(Object.keys(this.options.steps));

        if (last && this.options.steps[last]) {
            redirect = this.options.steps[last].next || last;
        }
        res.redirect(this.resolvePath(req.baseUrl, redirect, true));
    }

    errorHandler(err, req, res, next) {
        if (err.code === 'MISSING_PREREQ') {
            this.missingPrereqHandler(req, res, next);
        } else {
            super.errorHandler(err, req, res, next);
        }
    }

    use() {
        let middleware = _.flatten(arguments);
        middleware = _.map(middleware, fn => fn.bind(this));
        super.use.apply(this, middleware);
    }

    middlewareSetup() {
    }

    middlewareChecks() {
    }

    middlewareActions() {
    }

    middlewareLocals() {
    }

    requestHandler() {
        this.middlewareSetup();
        this.middlewareChecks();
        this.middlewareActions();
        this.middlewareLocals();
        return super.requestHandler();
    }
}

// Apply middleware mixins to Controller class

let Controller = BaseController;
Controller = require('./mixins/resolve-path')(Controller);
Controller = require('./mixins/base-url')(Controller);
Controller = require('./mixins/translate')(Controller);
Controller = require('./mixins/session-model')(Controller);
Controller = require('./mixins/check-session')(Controller);
Controller = require('./mixins/check-progress')(Controller);
Controller = require('./mixins/csrf')(Controller);
Controller = require('./mixins/invalidate-fields')(Controller);
Controller = require('./mixins/back-links')(Controller);


Controller.Error = ErrorClass;
Controller.validators = Form.validators;
Controller.formatters = Form.formatters;

module.exports = Controller;

