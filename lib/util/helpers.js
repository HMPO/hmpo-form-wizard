'use strict';

var _ = require('underscore');

module.exports = {
    getPreviousSteps: function(route, steps) {
        return _.reduce(steps, function (list, step, path) {
            var isNext = step.next === route;
            var forks = _.pluck((step.forks || []), 'target');

            var isFork = forks.some(function(fork) {
                return fork === route;
            });

            if (isNext || isFork) {
                list.push(path);
            }
            return list;
        }, []);
    }
}
