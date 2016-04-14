var _ = require('underscore'),
    debug = require('debug')('hmpo:progress-check');

module.exports = function checkProgress(route, controller, steps, start) {

    start = start || '/';

    // traverse the step journey using the
    // next param if present, returning an
    // array of steps
    var traverse = function traverse(step, steps, result) {
        result = result || [];
        var next = step.next;
        if (next && steps[next]) {
            return traverse(steps[next], steps, result.concat(step));
        }
        return result;
    }

    var getStepsJourney = function getStepsJourney(stepsJourney, prevStep) {
        stepsJourney = stepsJourney || [];
        // add currentStep to journey if not
        // already added
        if (stepsJourney.indexOf(route) === -1) {
            if (prevStep === undefined) {
                stepsJourney.push(route);
            } else {
                // add current step after the prev step
                // to preserve journey order
                var prevIndex = stepsJourney.indexOf(prevStep);
                stepsJourney.splice(prevIndex + 1, 0, route);
            }
        }

        return stepsJourney;
    };

    var getCurrentStepNumber = function getNextStep(stepsJourney) {
        // find index of current step, return as
        // 1-indexed for display.
        return stepsJourney.indexOf(route) + 1;
    };

    var getTotalSteps = function getTotalSteps(stepsJourney) {
        // get path by using only next params
        var linearPath = traverse(steps[start], steps);
        var linearPathSteps = _.pluck(linearPath, 'next');

        var index = 0;
        var forks = [];
        var arr = stepsJourney.slice();

        while (index < arr.length) {
            // if value doesn't follow the standard linear order
            // it is a fork, store value and continue with
            // comparison
            if (arr[index] !== linearPathSteps[index]) {
                forks.push(arr[index]);
                arr.splice(index, 1);
            } else {
                index++;
            }
        }

        // if no forks then journey is linear
        if (!forks.length) {
            return linearPath.length;
        }

        // we only need the last fork, as previous
        // forks will be included in the previous
        // journey steps.
        var lastFork = forks[forks.length - 1];
        var stepsBefore = stepsJourney.indexOf(lastFork);
        // traverse linearly from point of fork
        var shortestRouteToEnd = traverse(steps[lastFork], steps);

        // amount of steps before fork + fork + linear
        // steos after fork.
        return (stepsBefore + 1) + shortestRouteToEnd.length;
    };

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
        // only update step meta on GET requests
        if (req.method === 'GET') {
          var stepData = req.sessionModel.get('stepData') || {};
          var stepsJourney = getStepsJourney(stepData.stepsJourney, stepData.prevStep);
          var stepNumber = getCurrentStepNumber(stepsJourney);
          var totalSteps = getTotalSteps(stepsJourney);
          var prevStep = route;

          req.sessionModel.set('stepData', {
            stepsJourney: stepsJourney,
            prevStep: prevStep
          });

          res.locals.stepNumber = stepNumber;
          res.locals.totalSteps = totalSteps;
        }

        _.each(invalidatingFields, function (field, key) {
            req.sessionModel.on('change:' + key, function () {
                debug('Unsetting fields %s', field.invalidates.join(', '));
                req.sessionModel.unset(field.invalidates);
                var steps = _.difference(req.sessionModel.get('steps'), laterSteps);
                req.sessionModel.set('steps', steps);
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
