var _ = require('underscore'),
    debug = require('debug')('hmpo:progress-check');

module.exports = function checkProgress(route, controller, steps, start) {

    start = start || '/';

    var referer = '';

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
        if (path === start && referer.indexOf(steps[path].allowReferer) === -1) {
            sessionsteps = [];
        }
        sessionsteps.push(path);
        req.sessionModel.set('steps', sessionsteps);
    });

    return function (req, res, next) {

        if (req.method === 'GET' && req.header('Referer')) {
            referer = req.header('Referer')
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
        debug('Prereqs ', prereqs);
        debug('Visited ', visited);
        if (visited.length || !prereqs.length) {
            next();
        } else {
            var err = new Error('Missing prerequisite');
            err.code = 'MISSING_PREREQ';
            next(err);
        }
    };

};
