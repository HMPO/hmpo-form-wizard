'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:import');

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();
        this.use(this.importJourneyData);
    }

    importJourneyData(req, res, next) {
        if (req.form.options.import) {
            let imports = {};
            let missing = [];
            let dataSources = req.journeyModel.get('dataSources') || {};
            _.each(req.form.options.import, (options, field) => {
                if (typeof options === 'boolean') {
                    options = { required: options };
                }
                let data = dataSources[field];
                if (data && data.wizard !== req.form.options.name) {
                    let wizardModel = req.session['hmpo-wizard-' + data.wizard];
                    if (wizardModel) {
                        imports[field] = wizardModel[field];
                    }
                }

                if (options.required !== false && typeof imports[field] === 'undefined') {
                    missing.push(field);
                }
            });

            if (missing.length) {
                let err = new Error('Required imports missing ' + missing.join(', '));
                err.code = 'MISSING_IMPORT';
                err.fields = missing;
                return next(err);
            }

            req.sessionModel.set(imports);
        }

        req.sessionModel.on('change', changes => this._recordJourneyData(req, res, changes));
        next();
    }

    // invalidate steps after this step where fields were used in branching conditions
    _recordJourneyData(req, res, changes) {
        changes = _.keys(_.omit(changes, 'csrf-secret'));
        if (!changes.length) {
            return;
        }

        let dataSources = req.journeyModel.get('dataSources') || {};

        // find the index of the current step in the history

        _.each(changes, field => {
            let data = dataSources[field];
            if (!data) {
                data = {
                    path: this.resolvePath(req.baseUrl, req.form.options.route, true),
                    wizard: req.form.options.name
                };
                dataSources[field] = data;
                debug('Data source recorded', req.form.options.route, field, req.form.options.name);
            }
        });

        req.journeyModel.set('dataSources', dataSources);
    }

    getNextStepObject(req, res) {
        let nextStep = super.getNextStepObject(req, res);
        let fields = nextStep.fields || [];
        if (req.form.options.import) {
            fields = fields.concat(Object.keys(req.form.options.import));
        }
        if (fields.length) {
            nextStep.fields = _.uniq(fields);
        }
        return nextStep;
    }
};
