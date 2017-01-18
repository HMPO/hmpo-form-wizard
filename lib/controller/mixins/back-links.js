'use strict';

const url = require('url');
const _ = require('underscore');

module.exports = Controller => class extends Controller {

    middlewareLocals() {
        super.middlewareLocals();
        // This is used as early as possible so the base URL can be used in error pages
        this.use(this.backlinksSetLocals);
    }

    backlinksSetLocals(req, res, next) {
        if (req.method !== 'GET') {
            return next();
        }

        let last = _.last(req.sessionModel.get('steps'));
        let isBackLink = (last === this.options.route || last === this.options.next);
        req.isBackLink = isBackLink;
        res.locals.isBackLink = isBackLink;
        res.locals.backLink = this.getBackLink(req, res);

        next();
    }

    getBackLink(req, res) {
        let backLink;

        // if specified in controller options return that
        if (typeof this.options.backLink !== 'undefined') {
            return this.resolvePath(req.baseUrl, this.options.backLink);
        }

        if (this.options.backLinks) {
            return this._backlinksCheckHistory(req, res) ||
                this._backlinksCheckReferrer(req, res) ||
                undefined;
        }

        // if there is a valid visited prereq use that
        backLink = this._backlinksGetLastVistedPrereq(req, res);
        if (backLink) { return backLink; }

        // otherwise return undefined
        return undefined;
    }

    _backlinksGetLastVistedPrereq(req, res) {
        // work out last visted prereq step
        let previousSteps = _.filter(_.keys(this.options.steps), step => this.options.steps[step].next === this.options.route);
        let prereqSteps = _.union(previousSteps, this.options.prereqs);
        let visitedSteps = req.sessionModel.get('steps');
        let visitedPrereqs = _.intersection(visitedSteps, prereqSteps);
        let lastVistedPrereq = _.last(visitedPrereqs);

        return this.resolvePath(req.baseUrl, lastVistedPrereq, true);
    }

    _backlinksCheckHistory(req, res) {
        let visitedSteps = _.map(req.sessionModel.get('steps'), step => this.resolvePath(req.baseUrl, step, true));
        let backLinks = _.map(this.options.backLinks, link => this.resolvePath(req.baseUrl, link));
        let visitedBackLinks = _ .intersection(visitedSteps, backLinks);
        return _.last(visitedBackLinks);
    }

    _backlinksCheckReferrer(req, res) {
        let referrer = req.get('referrer');
        if (!referrer) {
            return null;
        }
        let referrerPath = url.parse(referrer).path;

        let backLink = null;
        _.find(this.options.backLinks, link => {
            link = this.resolvePath(req.baseUrl, link);
            if (link === referrer || link === referrerPath) {
                backLink = link;
                return true;
            }
        });

        return backLink;
    }

};
