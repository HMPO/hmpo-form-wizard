var express = require('express'),
    _ = require('underscore'),
    Form = require('./controller');

var names = [];

var Wizard = function (steps, fields, settings) {

    settings = _.extend({
        templatePath: 'pages',
        controller: Form,
        name: 'hmpo-wizard'
    }, settings || {});

    // prevent potentially conflicting session namespaces
    if (names.indexOf(settings.name) > -1) {
        settings.name += ('-' + names.length);
    }
    names.push(settings.name);

    var app = express.Router();

    app.use(require('cookie-parser')());

    app.use(require('./middleware/session'));
    app.use(require('./middleware/session-model')(settings));

    var first;

    _.each(steps, function (options, route) {

        first = first || route;

        options = _.clone(options);

        options.fields = _.pick(fields, options.fields);
        options.steps = steps;

        // default template is the same as the pathname
        options.template = options.template || route.replace(/^\//, '');
        options.template = settings.templatePath + '/' + options.template;

        var Controller = options.controller || settings.controller;

        var controller = new Controller(options);

        app.route(route)
            .all([
                require('./middleware/check-session')(route, controller, steps, first),
                require('./middleware/back-links')(route, controller, steps, first),
                require('./middleware/check-progress')(route, controller, steps, first),
                controller.requestHandler()
            ]);

    });

    app.use(require('./error-handler')(first));

    return app;

};

Wizard.Controller = Form;

module.exports = Wizard;