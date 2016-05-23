var steps = require('./steps'),
    fields = require('./fields');

var app = require('express').Router();

app.use(require('hmpo-template-mixins')(fields));

app.use(require('../../')(steps, fields));

module.exports = app;
