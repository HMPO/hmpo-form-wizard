var express = require('express'),
    util = require('util'),
    _ = require('underscore'),
    Form = require('./controller'),
    ErrorClass = require('./error');

var count = 0;

var Wizard = function (steps, fields, settings) {

    settings = _.extend({
        templatePath: 'pages',
        params: '',
        controller: Form
    }, settings || {});

    // prevent potentially conflicting session namespaces
    if (!settings.name) {
        settings.name = 'hmpo-wizard-' + count;
        count++;
    }

    var app = express.Router();

    app.use(require('./middleware/session'));

    var first;

    _.each(steps, function (options, route) {

        first = first || route;

        options = _.clone(options);

        options.fields = _.object(options.fields, _.map(options.fields, function(f) { return fields[f] || {}; }));
        options.steps = steps;

        // default template is the same as the pathname
        options.template = options.template || route.replace(/^\//, '');
        options.template = settings.templatePath + '/' + options.template;

        var Controller = options.controller || settings.controller;

        var controller = new Controller(options);
        controller.Error = function () {
            ErrorClass.apply(this, arguments);
        };
        util.inherits(controller.Error, ErrorClass);
        if (settings.translate) {
            controller.Error.prototype.translate = settings.translate;
        }

        var stack = [
            require('./middleware/session-model')(settings),
            require('./middleware/check-session')(route, controller, steps, first),
            require('./middleware/back-links')(route, controller, steps, first),
            require('./middleware/check-progress')(route, controller, steps, first)
        ];
        if (settings.csrf !== false) {
            stack.push(require('./middleware/csrf')(route, controller, steps, first));
        }
        stack.push(controller.requestHandler());

        app.route(route + settings.params)
            .all(stack);

    });

    return app;

};

Wizard.Controller = Form;

module.exports = Wizard;