var _ = require('underscore'),
    debug = require('debug')('hmpo:progress-check');

module.exports = function checkProgress(route, controller, steps, start) {

    start = start || '/';

    var previousSteps = _.reduce(steps, function (list, step, path) {
        if (step.next === route) {
            list.push(path);
        }
        return list;
    }, []);

    var prereqs = (controller.options.prereqs || []).concat(previousSteps);

    var invalidatingFields = _.pick(controller.options.fields, function (f) {
        return f && f.invalidates && f.invalidates.length;
    });

    var getLaterSteps = function (path) {
        var s = [];
        while (path) {
            s.push(path);
            path = steps[path] && steps[path].next;
        }
        return s;
    };

    /*
     * Utility function which accepts an array of invalidating fields
     * and the steps config object, returns a filtered steps object
     * containing fields which have been invalidated.
     */
    var getStepsToCheck = function getStepsToCheck(fields, steps) {
        return _.pick(steps, function (step) {
            if (!step.fields) {
                return false;
            }
            return _.intersection(step.fields, fields).length;
        });
    };

    /*
     * Utility function which accepts an array of invalidating fields,
     * the steps config object and the sessionModel. It returns an array
     * of step names for which all fields have been invalidated.
     */
    var getInvalidatedSteps = function getInvalidatedSteps(fields, steps, sessionModel) {
        var stepsToCheck = getStepsToCheck(fields, steps);

        return _.chain(stepsToCheck).pick(function (step) {
            return _.every(step.fields, function (item) {
                return sessionModel.get(item) === undefined;
            });
        }).keys().value();
    };

    var laterSteps = getLaterSteps(route);

    controller.on('complete', function (req, res, path) {
        var sessionsteps = req.sessionModel.get('steps') || [];
        path = path || route;
        debug('Marking path complete ', path);
        var index = sessionsteps.indexOf(path);
        if (index > -1) {
            sessionsteps.splice(index, 1);
        }
        if (path === start) {
            sessionsteps = [];
        }
        sessionsteps.push(path);
        req.sessionModel.set('steps', sessionsteps);
    });

    return function (req, res, next) {

        _.each(invalidatingFields, function (field, key) {
            req.sessionModel.on('change:' + key, function () {
                debug('Unsetting fields %s', field.invalidates.join(', '));
                req.sessionModel.unset(field.invalidates);
                var stepNames = _.difference(req.sessionModel.get('steps'), laterSteps);
                var invalidatedSteps = getInvalidatedSteps(field.invalidates, steps, req.sessionModel);
                req.sessionModel.set('steps', _.difference(stepNames, invalidatedSteps));
            });
        });

        var visited = _.intersection(req.sessionModel.get('steps'), prereqs);

        debug('Steps ', req.sessionModel.get('steps'));
        debug('Prereqs ' + prereqs);
        debug('Visited ' + visited);
        if (visited.length || !prereqs.length) {
            next();
        } else {
            var err = new Error('Missing prerequisite');
            err.code = 'MISSING_PREREQ';
            next(err);
        }
    };

};
