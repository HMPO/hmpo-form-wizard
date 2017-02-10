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

        // get steps that could be invalidated by each field
        let invalidatingFieldSteps = _.pick(
            _.mapObject(invalidatingFields,
                invalidates => _.keys(_.pick(req.form.options.steps,
                    step => _.intersection(_.keys(step.fields), invalidates).length
                ))
            ),
            s => s && s.length
        );
        debug('Invalidating Steps', invalidatingFieldSteps);

        // when each field is changed, invalidate fields and steps
        _.each(invalidatingFields, (invalidates, name) => {
            req.sessionModel.on('change:' + name, () => {
                debug('Invalidating fields because field changed', name, invalidates);
                req.sessionModel.unset(invalidates);

                debug('Invalidating steps because field changed', name, invalidatingFieldSteps[name]);
                _.each(invalidatingFieldSteps[name], step => {
                    let path = this.resolvePath(req.baseUrl, step, true);
                    this.removeJourneyHistoryStep(req, res, path);
                });
            });
        });

        next();
    }

};
