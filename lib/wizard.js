'use strict';

const express = require('express');
const _ = require('underscore');
const Controller = require('./controller');

let uniqueWizardId = 0;

let wizard = function (steps, fields, wizardOptions) {
    // create a wizard router
    let app = express.Router();

    // prevent potentially conflicting session namespaces
    wizardOptions = wizardOptions || {};
    wizardOptions.name = wizardOptions.name || String(uniqueWizardId++);

    // TODO: keys order is undefined
    let firstStep = _.first(_.keys(steps));

    // process step options and merge with wizard options
    let processedSteps = _.mapObject(steps, (options, route) => {
        options = _.extend({
            route,
            params: '',
            controller: Controller,
            firstStep,
        }, wizardOptions, options);

        // convert field list to field definitions
        if (_.isArray(options.fields)) {
            options.fields = _.object(
                options.fields,
                _.map(options.fields, f => fields[f] || {} )
            );
        }

        return options;
    });

    // create a controller for each route
    _.each(processedSteps, (options, route) => {
        options.steps = processedSteps;

        // create a new controller instance
        let ControllerClass = options.controller;
        let controller = new ControllerClass(options);

        // add the controller router to the wizard router at the step path
        let controllerRouter = controller.requestHandler();
        app.all(route + options.params, controllerRouter);
    });

    return app;
};

wizard.Controller = Controller;
wizard.Error = Controller.Error;

module.exports = wizard;
