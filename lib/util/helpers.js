'use strict';

var _ = require('underscore');

module.exports = {
    getRouteSteps: function (route, steps) {
        return _.reduce(steps, function (list, step, path) {
            var isNext = step.next === route;
            var targets = _.pluck((step.forks || []), 'target');

            var isFork = targets.some(function (fork) {
                return fork === route;
            });

            if (isNext || isFork) {
                list.push(path);
            }
            return list;
        }, []);
    }
};
