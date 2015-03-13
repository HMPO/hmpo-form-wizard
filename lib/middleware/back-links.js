var url = require('url'),
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
        referrerPath = referrerPath.replace(baseUrl, '');
        if (controller.options.backLinks.indexOf(referrerPath) > -1) {
            return referrerPath;
        }
    };

    var getBackLink = function (req) {
        var previous = _.intersection(req.sessionModel.get('steps'), previousSteps),
            backLink;

        if (previous.length) {
            backLink = _.last(previous);
        } else if (controller.options.backLink) {
            backLink = controller.options.backLink;
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