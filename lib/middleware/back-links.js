var url = require('url'),
    path = require('path'),
    _ = require('underscore'),
    getPreviousSteps = require('../util/helpers').getPreviousSteps;

module.exports = function backLink(route, controller, steps) {

    var previousSteps = getPreviousSteps(steps, route);

    var checkReferrer = function (referrer, baseUrl) {
        var referrerPath = url.parse(referrer).path;
        var matchingPath = _.find(controller.options.backLinks, function (link) {
            if (link.match(/^\//)) {
                return path.normalize(link) === referrerPath;
            } else {
                return path.normalize(link) === path.relative(baseUrl, referrerPath);
            }
        });
        if (typeof matchingPath === 'string') {
            return path.normalize(matchingPath);
        }
    };

    var checkFormHistory = function (sessionData) {
        var previousSteps = _.chain(sessionData)
            .pick(function(value, key, object) { return key.indexOf('hmpo-wizard') > -1; })
            .pluck('steps')
            .flatten()
            .uniq()
            .value();

        var allowedLinks = _.map(controller.options.backLinks, function(item) {
            return item.replace('\.', '');
        });

        var backLinks = _.intersection(previousSteps, allowedLinks);

        return backLinks.length ? _.last(backLinks).replace(/^\//, '') : undefined;
    };

    var getBackLink = function (req) {
        var previous = _.intersection(req.sessionModel.get('steps'), previousSteps),
            backLink;

        if (typeof controller.options.backLink !== 'undefined') {
            return controller.options.backLink;
        } else if (previous.length) {
            backLink = _.last(previous).replace(/^\//, '');
        } else if (controller.options.backLinks && req.get('referrer')) {
            backLink = checkReferrer(req.get('referrer'), req.baseUrl) || checkFormHistory(req.session);
        }

        return backLink;
    };

    return function (req, res, next) {
        if (req.method === 'GET') {
            var last = _.last(req.sessionModel.get('steps'));
            req.isBackLink = (last === route || last === controller.options.next);
            res.locals.backLink = getBackLink(req);
        }
        next();
    };

};
