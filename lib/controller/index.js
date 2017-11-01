'use strict';

const debug = require('debug')('hmpo:controller');
const _ = require('underscore');
const path = require('path');
const ErrorClass = require('../error');
const deepCloneMerge = require('deep-clone-merge');
const express = require('express');

const formatting = require('../formatting');
const validation = require('../validation');

class BaseController {
    constructor(options) {
        if (!options) {
            throw new Error('Options must be provided');
        }
        if (!options.route) {
            throw new Error('A route must be specified');
        }
        // default template is the same as the pathname
        options.template = options.template || options.route.replace(/^\//, '') || 'index';
        if (options.templatePath) {
            options.template = path.join(options.templatePath, options.template);
        }

        options.fields = options.fields || {};
        options.allFields = options.allFields || options.fields;

        options.defaultFormatters = options.defaultFormatters || ['trim', 'singlespaces', 'hyphens'];

        if (options.noGet) {
            this.get = null;
        }

        if (options.noPost) {
            this.post = null;
        }

        this.options = options;
        this.Error = ErrorClass;
    }

    _bindFunctions() {
        let fns = _.flatten(arguments);
        fns = _.map(fns, fn => typeof fn ==='function' ? fn.bind(this) : fn);
        return fns;
    }

    // this.use(fn1, fn2)
    use() {
        if (!this.router) throw new Error('Cannot use middleware outside of middleware mixins');
        let args = this._bindFunctions(arguments);
        this.router.use.apply(this.router, args);
    }

    // this.useWithMethod('get', fn1, fn2)
    useWithMethod(method) {
        if (!this.router) throw new Error('Cannot use middleware outside of middleware mixins');
        let args = this._bindFunctions(arguments);
        args[0] = '*';
        this.router[method].apply(this.router, args);
    }

    requestHandler() {
        debug('%s #requestHandler', this.options.route);

        this.router = express.Router({ mergeParams: true });

        this.use(this._configure);
        this.middlewareMixins();

        let methods = ['get', 'post', 'put', 'delete'];
        methods.forEach(method => {
            if (typeof this[method] === 'function') {
                this.useWithMethod(method, this[method]);
            } else {
                this.useWithMethod(method, this.methodNotSupported);
            }
        });
        this.use(this.errorHandler);
        return this.router;
    }

    methodNotSupported(req, res, next) {
        debug('%s #methodNotSupported', req.originalUrl);
        let err = new Error('Method not supported');
        err.statusCode = 405;
        next(err);
    }

    _configure(req, res, next) {
        debug('%s #_configure', req.originalUrl);
        req.form = req.form || {};
        req.form.options = deepCloneMerge(this.options);
        this.configure(req, res, next);
    }

    configure(req, res, next) {
        next();
    }

    get(req, res, next) {
        debug('%s #get', req.originalUrl);
        let lifecycle = [
            this._getErrors,
            this._getValues,
            this._locals,
            this._checkStatus,
            this.render
        ];
        let router = express.Router({ mergeParams: true });
        router.use(this._bindFunctions(lifecycle));
        router(req, res, next);
    }

    post(req, res, next) {
        debug('%s #post', req.originalUrl);
        let lifecycle = [
            this._resetErrors,
            this._process,
            this._validate,
            this.saveValues,
            this.successHandler
        ];
        let router = express.Router({ mergeParams: true });
        router.use(this._bindFunctions(lifecycle));
        router(req, res, next);
    }

    _getErrors(req, res, next) {
        debug('%s #_getErrors', req.originalUrl);
        req.form.errors = this.getErrors(req, res);
        next();
    }

    getErrors(req, res) {
        debug('%s #getErrors', req.originalUrl);
        let errs = req.sessionModel.get('errors');
        errs = _.pick(errs, Object.keys(req.form.options.fields));
        errs = _.pick(errs, e => !e.url || e.url === req.path);
        errs = _.pick(errs, err => !err.redirect );
        return errs;
    }

    _getValues(req, res, next) {
        debug('%s #_getValues', req.originalUrl);
        this.getValues(req, res, (err, values) => {
            req.form.values = values || {};
            next(err);
        });
    }

    getValues(req, res, callback) {
        debug('%s #getValues', req.originalUrl);
        let values = req.sessionModel.toJSON();

        let errs = values.errors;
        delete values.errors;

        let errorValues = values.errorValues;
        delete values.errorValues;

        // pick errorValues that are for this step's fields
        errorValues = _.pick(errorValues, Object.keys(req.form.options.fields));
        // pick errorValues that were generated on the same url
        errorValues = _.pick(errorValues, (e, k) => !errs || !errs[k] || !errs[k].url || errs[k].url === req.path);

        values = _.extend(values, errorValues);
        callback(null, values);
    }

    _locals(req, res, next) {
        debug('%s #_locals', req.originalUrl);

        let errorlist = _.values(req.form.errors);
        errorlist = _.reject(errorlist, error => error.errorGroup && error.errorGroup !== error.key);

        _.extend(res.locals, {
            errors: req.form.errors,
            errorlist,
            values: req.form.values,
            options: req.form.options,
            action: req.originalUrl,
            nextPage: this.getNextStep(req, res)
        });

        if (this.locals.length < 3) {
            _.extend(res.locals, this.locals(req, res));
            return next();
        }

        this.locals(req, res, (err, locals) => {
            _.extend(res.locals, locals);
            next(err);
        });
    }

    locals(req, res, callback) {
        if (typeof callback === 'function') return callback(null, {});
        return {};
    }

    _checkStatus(req, res, next) {
        debug('%s #_checkStatus', req.originalUrl);
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

    render(req, res, next) {
        debug('%s #render', req.originalUrl, req.form.options.template);
        if (!req.form.options.template) {
            return next(new Error('A template must be provided'));
        }

        res.render(req.form.options.template);
    }

    _resetErrors(req, res, next) {
        debug('%s #_resetErrors', req.originalUrl);
        this.setErrors(null, req, res);
        next();
    }

    setErrors(err, req, res) {
        debug('%s #setErrors', req.originalUrl);
        if (req.form.values) {
            req.sessionModel.set('errorValues', req.form.values);
        }
        req.sessionModel.set('errors', err);
    }

    _process(req, res, next) {
        debug('%s #_proccess', req.originalUrl);
        let fields = req.form.options.fields;
        let values = req.form.values = req.form.values || {};
        let defaultFormatters = req.form.options.defaultFormatters;

        _.each(fields, (field, key) => {
            let value = req.body[key];
            req.form.values[key] = formatting.format(fields, key, value, defaultFormatters);
        });

        // set values to formatted '' if the field is not allowed
        _.each(fields, (field, key) => {
            if (!validation.isAllowedDependent(fields, key, values)) {
                req.form.values[key] = formatting.format(fields, key, null, defaultFormatters);
            }
        });
        this.process(req, res, next);
    }

    process(req, res, next) {
        next();
    }

    _validate(req, res, next) {
        debug('%s #_validate', req.originalUrl);

        this.validateFields(req, res, errors => {
            if (!_.isEmpty(errors)) return next(errors);
            this.validate(req, res, next);
        });
    }

    validateFields(req, res, callback) {
        let errors = {};

        _.each(req.form.values, (value, key) => {
            let error = this.validateField(key, req, res);
            if (error) {
                errors[error.key] = new this.Error(error.key, error, req, res);
                if (error.errorGroup) {
                    errors[error.errorGroup] = new this.Error(error.errorGroup, error, req, res);
                }
            }
        });

        callback(errors);
    }

    validateField(key, req, res) {
        let fields = req.form.options.fields;
        let value = req.form.values[key];
        let values = req.form.values;
        if (validation.isAllowedDependent(fields, key, values)) {
            return validation.validate(fields, key, value);
        }
    }

    validate(req, res, next) {
        next();
    }

    saveValues(req, res, next) {
        debug('%s #saveValues', req.originalUrl);
        req.sessionModel.set(req.form.values);
        req.sessionModel.unset('errorValues');
        next();
    }

    successHandler(req, res, next) {
        debug('%s #successHandler', req.originalUrl);
        this.setStepComplete(req, res);
        res.redirect(this.getNextStep(req, res));
    }

    isValidationError(err) {
        return !_.isEmpty(err) && _.all(err, e => e instanceof this.Error);
    }

    errorHandler(err, req, res, next) {
        debug('%s #errorHandler', req.originalUrl, err);
        if (this.isValidationError(err)) {
            this.setErrors(err, req, res);
            if (req.form.options.skip) return next(err);
            return res.redirect(this.getErrorStep(err, req));
        }
        // if the error is not a validation error then throw and let the error handler pick it up
        return next(err);
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
Controller = require('./mixins/invalidate-journey')(Controller);
Controller = require('./mixins/invalidate-fields')(Controller);
Controller = require('./mixins/back-links')(Controller);
Controller = require('./mixins/next-step')(Controller);
Controller = require('./mixins/edit-step')(Controller);


Controller.Error = ErrorClass;
Controller.validators = validation.validators;
Controller.formatters = formatting.formatters;

module.exports = Controller;

