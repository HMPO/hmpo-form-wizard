'use strict';

const { Router } = require('express');
const wizard = require('hmpo-form-wizard');
const steps = require('./steps');
const fields = require('./fields');

const app = Router();

app.use(wizard(steps, fields, {
    journeyName: 'branching',
    name: 'branching',
    templatePath: 'pages/branching'
}));

module.exports = app;
