'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:validation');
const validators = require('./validators');

function applyValidator(validator, key, value) {

    if (typeof validator === 'string') validator = { type: validator };
    if (typeof validator === 'function') validator = { fn: validator };

    if (typeof validator.fn === 'function') {
        validator.type = validator.type || validator.fn.name;
        if (!validator.type || validator.type === 'fn' || validator.type === 'validate') {
            throw new Error('Custom validator needs to be a named function');
        }
    }

    if (typeof validator.fn !== 'function') {
        validator.fn = validators[validator.type];
        if (!validator.fn) {
            throw new Error('Undefined validator: ' + validator.type);
        }
    }

    let args = [];
    if (_.isArray(validator.arguments)) {
        args = validator.arguments;
    } else if (validator.arguments !== undefined) {
        args = [ validator.arguments ];
    }

    debug('Applying %s validator with value "%s"', validator.type, value, args);
    let result = validator.fn.apply(this, [value].concat(args));

    if (!result) {
        return _.extend({ key: key }, _.omit(validator, 'fn'));
    }
}

function isAllowedDependent(fields, key, values) {
    debug('Checking if field %s is allowed', key);
    let field = fields[key];
    if (!field) return false;

    // set up dependent to an object of field and value
    if (typeof field.dependent === 'string') {
        field.dependent = {
            field: field.dependent,
            value: true
        };
    }

    // validate if any dependent value matches any field value
    if (field.dependent && fields[field.dependent.field]) {
        let dependent = field.dependent;

        let dependentValues = Array.isArray(dependent.value) ?
            dependent.value : [ dependent.value ];

        let fieldValues = Array.isArray(values[dependent.field]) ?
            values[dependent.field] : [ values[dependent.field] ];

        let matches = _.intersection(dependentValues, fieldValues);

        debug('Checking dependent values for field %s: matching field %s dependent values %j to field values %j = %j',
            key, dependent.field, dependentValues, fieldValues, matches);

        if (_.isEmpty(matches)) return false;
    }

    return true;
}

function validate(fields, key, value) {
    debug('Validating field %s with value "%s"', key, value);
    let field = fields[key];
    if (!field) return false;

    // convert validators to array of validators
    if (!_.isArray(field.validate)) {
        field.validate = [ field.validate ];
    }
    field.validate = _.filter(field.validate, _.identity);

    // validate against field options
    if (field.options && !field._validateFieldOptions) {
        field._validateFieldOptions = true;
        field.validate.push({
            type: 'equal',
            arguments: _.map(field.options, o => typeof o === 'string' ? o : o.value)
        });
    }

    let err;
    _.find(
        field.validate,
        validator => err = applyValidator(validator, key, value)
    );
    return err;
}

module.exports = {
    validators,
    isAllowedDependent,
    validate
};
