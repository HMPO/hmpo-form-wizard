var express = require('express'),
    templateMixins = require('hmpo-template-mixins'),
    wizard = require('../../'),
    steps = require('./steps'),
    fields = require('./fields');

var app = express.Router();

app.use(templateMixins(fields));

app.use(wizard(steps, fields, { templatePath: 'pages' }));

module.exports = app;
