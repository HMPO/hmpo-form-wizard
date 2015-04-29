var steps = require('./steps'),
    fields = require('./fields'),
    i18n = require('i18next');

var app = require('express').Router();

app.use(require('hmpo-template-mixins')(i18n.t, fields));

app.use(require('../../')(steps, fields, { translate: i18n.t }));

module.exports = app;