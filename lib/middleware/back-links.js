'use strict';

var url = require('url');
var path = require('path');
var _ = require('underscore');

module.exports = function generateBackLink(route, controller, steps) {
  var previousSteps = _.reduce(steps, function getPreviousSteps(list, step, key) {
    if (step.next === route) {
      list.push(key);
    }
    return list;
  }, []);

  var checkReferrer = function checkReferrer(referrer, baseUrl) {
    var referrerPath = url.parse(referrer).path;
    var matchingPath = _.find(controller.options.backLinks, function getMatchingPath(link) {
      if (link.match(/^\//)) {
        return path.normalize(link) === referrerPath;
      }
      return path.normalize(link) === path.relative(baseUrl, referrerPath);
    });
    if (typeof matchingPath === 'string') {
      return path.normalize(matchingPath);
    }
    return matchingPath;
  };

  var checkFormHistory = function checkFormHistory(sessionData) {
    var previousStepsFromSessionData = _.chain(sessionData)
      .pick(function pick(value, key) {
        return key.indexOf('hmpo-wizard') > -1;
      })
      .pluck('steps')
      .flatten()
      .uniq()
      .value();

    var allowedLinks = _.map(controller.options.backLinks, function mapAllowedLinks(item) {
      return item.replace('\.', '');
    });

    var backLinks = _.intersection(previousStepsFromSessionData, allowedLinks);

    return backLinks.length ? _.last(backLinks).replace(/^\//, '') : undefined;
  };

  var getBackLink = function getBackLink(req) {
    var previous = _.intersection(req.sessionModel.get('steps'), previousSteps);
    var backLink;

    if (typeof controller.options.backLink !== 'undefined') {
      return controller.options.backLink;
    } else if (previous.length) {
      backLink = _.last(previous).replace(/^\//, '');
    } else if (controller.options.backLinks && req.get('referrer')) {
      backLink = checkReferrer(req.get('referrer'), req.baseUrl) || checkFormHistory(req.session);
    }

    return backLink;
  };

  return function backLinksMiddleware(req, res, next) {
    if (req.method === 'GET') {
      var last = _.last(req.sessionModel.get('steps'));
      req.isBackLink = last === route || last === controller.options.next;
      res.locals.backLink = getBackLink(req);
    }
    next();
  };
};
