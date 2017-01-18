'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:invalidate-fields');

module.exports = Controller => class extends Controller {

    middlewareActions() {
        super.middlewareActions();

        this.use(this.invalidateFields);
    }

    invalidateSteps(req, invalidSteps) {
        let steps = req.sessionModel.get('steps');
        _.each(invalidSteps, step => {
            let stepIndex = _.indexOf(steps, step);
            debug('Invalidating step', step, 'at position', stepIndex);
            if (stepIndex >= 0) {
                steps.splice(stepIndex);
            }
        });
        req.sessionModel.set('steps', steps);
    }

    invalidateFields(req, res, next) {
        // fields used by this step that invalidate other fields
        let invalidatingFields = _.pick(
            this.options.fields,
            f => f && f.invalidates && f.invalidates.length
        );

        _.each(invalidatingFields, (field, key) => {
            req.sessionModel.on('change:' + key, () => {
                debug('Unsetting fields', field.invalidates);
                req.sessionModel.unset(field.invalidates);

                let invalidSteps = _.keys(_.pick(
                    this.options.steps,
                    step => _.intersection(_.keys(step.fields), field.invalidates).length
                ));
                debug('Invalidating steps', invalidSteps);
                if (invalidSteps.length) {
                    this.invalidateSteps(req, invalidSteps);
                }
            });
        });

        next();
    }

};
