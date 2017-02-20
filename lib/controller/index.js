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

        if (this.options.noPost) {
            this.post = null;
        }

        this.Error = ErrorClass;
    }

    _checkStatus(req, res, next) {
        if (req.form.options.skip) {
            if (typeof this.post === 'function') {
                return this.post(req, res, next);
            }
            return this.successHandler(req, res, next);
        }

        if (typeof this.post !== 'function' && res.locals.nextPage !== req.originalUrl) {
            this.setStepComplete(req, res);
        }

        next();
    }

    errorHandler(err, req, res, next) {
        if (req.form.options.skip && this.isValidationError(err)) {
            this.setErrors(err, req, res);
            return next(err);
        }
        super.errorHandler(err, req, res, next);
    }

    successHandler(req, res, next) {
        this.setStepComplete(req, res);
        res.redirect(this.getNextStep(req, res));
    }

    getValues(req, res, callback) {
        let json = req.sessionModel.toJSON();
        delete json.errorValues;
        delete json.errors;
        let errs = req.sessionModel.get('errors');
        let errorValues = req.sessionModel.get('errorValues');
        errorValues = _.pick(errorValues, Object.keys(req.form.options.fields));
        errorValues = _.pick(errorValues, (e, k) => !errs || !errs[k] || !errs[k].url || errs[k].url === req.path);
        callback(null, _.extend(json, errorValues));
    }

    saveValues(req, res, callback) {
        req.sessionModel.set(req.form.values);
        req.sessionModel.unset('errorValues');
        callback();
    }

    getErrors(req, res) {
        let errs = req.sessionModel.get('errors');
        errs = _.pick(errs, Object.keys(req.form.options.fields));
        errs = _.pick(errs, e => !e.url || e.url === req.path);
        errs = _.pick(errs, err => !err.redirect );
        return errs;
    }

    setErrors(err, req, res) {
        if (req.form.values) {
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

    middlewareMixins() {
        this.middlewareSetup();
        this.middlewareChecks();
        this.middlewareActions();
        this.middlewareLocals();
    }
}

// Apply middleware mixins to Controller class

let Controller = BaseController;
Controller = require('./mixins/resolve-path')(Controller);
Controller = require('./mixins/base-url')(Controller);
Controller = require('./mixins/translate')(Controller);
Controller = require('./mixins/journey-model')(Controller);
Controller = require('./mixins/session-model')(Controller);
Controller = require('./mixins/check-session')(Controller);
Controller = require('./mixins/check-progress')(Controller);
Controller = require('./mixins/csrf')(Controller);
Controller = require('./mixins/invalidate-fields')(Controller);
Controller = require('./mixins/import')(Controller);
Controller = require('./mixins/back-links')(Controller);
Controller = require('./mixins/next-step')(Controller);
Controller = require('./mixins/edit-step')(Controller);


Controller.Error = ErrorClass;
Controller.validators = Form.validators;
Controller.formatters = Form.formatters;

module.exports = Controller;

