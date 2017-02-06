'use strict';

const _ = require('underscore');
const debug = require('debug')('hmpo:progress-check');

module.exports = Controller => class extends Controller {

    middlewareChecks() {
        super.middlewareChecks();

        this.on('complete', this.setStepComplete);

        this.use(this.checkJourneyProgress);
    }

    setStepComplete(req, res, path) {
        path = path || this.options.route;
        debug('Marking path complete ', path);

        let sessionsteps = req.sessionModel.get('steps') || [];
        sessionsteps = _.without(sessionsteps, path);
        sessionsteps.push(path);
        req.sessionModel.set('steps', sessionsteps);
    }

    checkJourneyProgress(req, res, next) {
        // steps that have this step and the next step
        let previousSteps = _.filter(_.keys(this.options.steps), step => this.options.steps[step].next === this.options.route);
        // add in controller defined prereqs
        let prereqSteps = _.union(previousSteps, this.options.prereqs);

        if (prereqSteps.length === 0) {
            // this step doesn't require any prereqs
            return next();
        }

        debug('Prereqs', prereqSteps);

        let visitedSteps = req.sessionModel.get('steps');
        debug('Visited Steps', visitedSteps);

        let visitedPrereqs = _.intersection(visitedSteps, prereqSteps);
        debug('Visited Prereqs', visitedPrereqs);

        if (visitedPrereqs.length === 0) {
            let err = new Error('Missing prerequisite');
            err.code = 'MISSING_PREREQ';
            return next(err);
        }

        next();
    }

};
