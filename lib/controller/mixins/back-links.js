'use strict';

const url = require('url');
const _ = require('underscore');
const debug = require('debug')('hmpo:back-links');

module.exports = Controller => class extends Controller {

    middlewareLocals() {
        super.middlewareLocals();
        // This is used as early as possible so the base URL can be used in error pages
        this.use(this.backlinksSetLocals);
    }

    backlinksSetLocals(req, res, next) {
        res.locals.backLink = this.getBackLink(req, res);
        next();
    }

    getBackLink(req, res) {
        let backLink;

        // if specified in controller options return that
        if (typeof req.form.options.backLink !== 'undefined') {
            return this.resolvePath(req.baseUrl, req.form.options.backLink);
        }

        if (req.form.options.backLinks) {
            return this._backlinksCheckHistory(req, res) ||
                this._backlinksCheckReferrer(req, res) ||
                undefined;
        }

        // get previous visited step in history
        backLink = this._backlinksGetHistoryStep(req, res);
        if (backLink) { return backLink; }

        // otherwise return undefined
        return undefined;
    }

    _backlinksGetHistoryStep(req, res) {
        let path = this.resolvePath(req.baseUrl, req.form.options.route, true);
        let journeyHistory = req.journeyModel.get('history') || [];

        let item = _.findWhere(journeyHistory, { next: path });
        while (item) {
            debug('Step has previous in history', req.form.options.route, item.path);
            if (!item.skip) {
                return item.path;
            }
            item = _.find(journeyHistory, { next: item.path });
        }

        return undefined;
    }

    _backlinksCheckHistory(req, res) {
        let journeyHistory = req.journeyModel.get('history');
        // clone reverse history
        journeyHistory = [].concat(journeyHistory).reverse();

        let backLinks = _.map(req.form.options.backLinks, link => this.resolvePath(req.baseUrl, link));

        let item = _.find(journeyHistory, item => _.contains(backLinks, item.path));

        if (item) {
            return item.path;
        }

        return undefined;
    }

    _backlinksCheckReferrer(req, res) {
        let referrer = req.get('referrer');
        if (!referrer) {
            return null;
        }
        let referrerPath = url.parse(referrer).path;

        let backLink = null;
        _.find(req.form.options.backLinks, link => {
            link = this.resolvePath(req.baseUrl, link);
            if (link === referrer || link === referrerPath) {
                backLink = link;
                return true;
            }
        });

        return backLink;
    }

};
