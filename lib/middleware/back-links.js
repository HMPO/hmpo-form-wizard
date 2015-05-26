var url = require('url'),
    path = require('path'),
    _ = require('underscore');

module.exports = function backLink(route, controller, steps) {

    var previousSteps = _.reduce(steps, function (list, step, path) {
        if (step.next === route) {
            list.push(path);
        }
        return list;
    }, []);

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

    var getBackLink = function (req) {
        var previous = _.intersection(req.sessionModel.get('steps'), previousSteps),
            backLink;

        if (typeof controller.options.backLink !== 'undefined') {
            return controller.options.backLink;
        } else if (previous.length) {
            backLink = _.last(previous).replace(/^\//, '');
        } else if (controller.options.backLinks && req.get('referrer')) {
            backLink = checkReferrer(req.get('referrer'), req.baseUrl);
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