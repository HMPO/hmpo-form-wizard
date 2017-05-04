'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:invalidate-fields');

module.exports = Controller => class extends Controller {

    middlewareActions() {
        super.middlewareActions();

        this.use(this.invalidateFields);
    }

    invalidateFields(req, res, next) {
        // get fields used by this step that invalidate other fields
        let invalidatingFields = _.pick(
            _.mapObject(req.form.options.fields, f => f.invalidates),
            f => f && f.length
        );
        debug('Invalidating fields', invalidatingFields);

        // when each field is changed, invalidate fields and steps
        _.each(invalidatingFields, (invalidates, name) => {
            req.sessionModel.on('change:' + name, () => {
                debug('Invalidating fields because field changed', name, invalidates);
                req.sessionModel.unset(invalidates);
            });
        });

        next();
    }

};
