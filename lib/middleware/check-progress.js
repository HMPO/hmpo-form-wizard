var _ = require('underscore'),
    debug = require('debug')('hmpo:progress-check'),
    helpers = require('../util/helpers');

module.exports = function checkProgress(route, controller, steps, start) {

    start = start || '/';

    var previousSteps = helpers.getRouteSteps(route, steps);

    var prereqs = (controller.options.prereqs || []).concat(previousSteps);

    var invalidatingFields = _.pick(controller.options.fields, function (f) {
        return f && f.invalidates && f.invalidates.length;
    });

    var invalidatePath = function (req, res) {
        var potentialPaths = _.pluck(controller.options.forks, 'target')
            .concat(controller.options.next);
        var nextStep = controller.getForkTarget(req, res);
        if (req.baseUrl !== '/') {
            nextStep = nextStep.replace((new RegExp('^' + req.baseUrl)), '');
        }
        var validateSteps = getAllPossibleSteps(nextStep, steps);

        var invalidateSteps = _.without(potentialPaths, nextStep).reduce(function (arr, step) {
            return arr.concat(getAllPossibleSteps(step, steps));
        }, []);

        _.difference(invalidateSteps, validateSteps).forEach(function (step) {
            invalidateStep(step, steps, req.sessionModel);
        });
    };

    var invalidateStep = function (stepName, steps, sessionModel) {
        debug('Invalidating', stepName);
        var step = steps[stepName] || {};
        sessionModel.unset(step.fields);
        sessionModel.set('steps', _.without(sessionModel.get('steps'), stepName));
    };

    var getAllPossibleSteps = function (stepName, steps) {
        var allSteps = [stepName];
        var step = steps[stepName];
        while (step && step.next) {
            allSteps.push(step.next);
            // ignore forks that have already been traversed.
            var forks = _.difference(_.pluck(step.forks, 'target'), allSteps);
            allSteps = allSteps.concat(forks.reduce(function (arr, fork) {
                return getAllPossibleSteps(fork, steps);
            }, []));
            step = steps[step.next];
        }
        return _.uniq(allSteps);
    };

    controller.on('complete', function (req, res, path) {

        if (req.method === 'POST' && controller.options.forks) {
            invalidatePath(req, res);
        }

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
