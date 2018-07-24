'use strict';

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
        // if specified in controller options return that
        if (typeof req.form.options.backLink !== 'undefined') {
            return this.resolvePath(req.baseUrl, req.form.options.backLink);
        }

        let backLink = this._backlinksGetHistoryStep(req, res, req.form.options.backLinks);
        if (backLink) return backLink;

        // otherwise return undefined
        return undefined;
    }

    _backlinksGetHistoryStep(req, res) {
        let path = this.resolvePath(req.baseUrl, req.form.options.route, true);
        let previousStep;
        this.walkJourneyHistory(req, res, (step, next) => {
            if (!step.skip) previousStep = step;
            return next && next.path === path;
        });

        if (previousStep) {
            debug('Step has previous in history', req.form.options.route, previousStep.path);
            return previousStep.path;
        }
    }
};
