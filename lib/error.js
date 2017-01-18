'use strict';

const _ = require('underscore');
const i18nLookup = require('i18n-lookup');
const Controller = require('hmpo-form-controller');
const Hogan = require('hogan.js');

class FormError extends Controller.Error {
    constructor(key, options, req, res) {
        req = req || {};
        options = options || {};
        super(key, options, req, res);
        this.translate = req.translate || _.identity;
    }

    compile(t, context) {
        return Hogan.compile(t).render(context);
    }

    getMessage(key, options, req, res) {
        res = res || {};
        let keys = [
            'validation.' + key + '.' + options.type,
            'validation.' + key + '.default',
            'validation.' + options.type,
            'validation.default'
        ];

        function getArgs(type, args) {
            if (type === 'past') {
                return { age: args.join(' ') };
            } else if (_.isArray(args) && typeof type === 'string') {
                let obj = {};
                obj[type] = args[0];
                return obj;
            }
            return {};
        }

        let context = _.extend(
            {
                label: this.translate('fields.' + key + '.label').toLowerCase(),
                legend: this.translate('fields.' + key + '.legend').toLowerCase()
            },
            res.locals,
            getArgs(options.type, options.arguments)
        );

        return i18nLookup(this.translate, this.compile)(keys, context);
    }
}

module.exports = FormError;
