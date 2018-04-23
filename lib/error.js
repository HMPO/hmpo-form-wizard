'use strict';

const _ = require('underscore');
const i18nLookup = require('i18n-lookup');
const Hogan = require('hogan.js');

class FormError {
    constructor(key, options, req, res) {
        req = req || {};
        options = _.extend({
            type: 'default'
        }, options);
        this.key = key;
        this.errorGroup = options.errorGroup;
        this.type = options.type;
        this.redirect = options.redirect;
        this.translate = req.translate || _.identity;
        this.url = req.path;
        Object.defineProperty(this, 'message', {
            enumerable: true,
            get: () => {
                return options.message || this.getMessage(this.key, options, req, res);
            }
        });
    }

    compile(t, context) {
        return Hogan.compile(t).render(context);
    }

    getOption(item, options, req) {
        return options[item] ||
            (req.form && req.form.options &&
                req.form.options &&
                req.form.options.fields[this.key] &&
                req.form.options.fields[this.key][item]);
    }

    getMessage(key, options, req, res) {
        let contentkey = this.getOption('contentKey', options, req, res) || key;

        res = res || {};
        let keys = [
            'validation.' + contentkey + '.' + options.type,
            'validation.' + contentkey + '.default',
            'validation.' + options.errorGroup + '.' + options.type,
            'validation.' + options.errorGroup + '.default',
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
                label: this.translate('fields.' + contentkey + '.label').toLowerCase(),
                legend: this.translate('fields.' + contentkey + '.legend').toLowerCase()
            },
            res.locals,
            getArgs(options.type, options.arguments)
        );

        return i18nLookup(this.translate, this.compile)(keys, context);
    }
}

module.exports = FormError;
