'use strict';

var express = require('express');
var _ = require('underscore');
var Form = require('./controller');

var count = 0;

var Wizard = function Wizard(steps, fields, settings) {

  settings = _.extend({
    templatePath: 'pages',
    params: '',
    controller: Form
  }, settings || {});

  // prevent potentially conflicting session namespaces
  if (!settings.name) {
    settings.name = count;
    count++;
  }

  settings.name = 'hmpo-wizard-' + settings.name;

  var app = express.Router();

  app.use(require('./middleware/session'));

  var first;

  _.each(steps, function eachStep(options, route) {

    first = first || route;

    options = _.clone(options);

    options.fields = _.object(options.fields, _.map(options.fields, function mapFields(f) {
      return fields[f] || {};
    }));
    options.steps = steps;

    // default template is the same as the pathname
    options.template = options.template || route.replace(/^\//, '');
    options.template = settings.templatePath + '/' + options.template;

    var Controller = options.controller || settings.controller;

    var controller = new Controller(options);

    controller.use([
      require('./middleware/check-session')(route, controller, steps, first),
      require('./middleware/check-progress')(route, controller, steps, first)
    ]);
    if (settings.csrf !== false) {
      controller.use(require('./middleware/csrf')(route, controller, steps, first));
    }

    app.route(route + settings.params)
    .all(function allRoutes(req, res, next) {
      if (settings.translate) {
        req.translate = settings.translate;
      }
      next();
    })
    .all(require('./middleware/session-model')(settings))
    .all(require('./middleware/back-links')(route, controller, steps, first))
    .all(controller.requestHandler());
  });

  return app;
};

Wizard.Controller = Form;
Wizard.Error = Form.Error;

module.exports = Wizard;
