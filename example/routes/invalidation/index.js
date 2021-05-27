'use strict';

const { Router } = require('express');
const wizard = require('hmpo-form-wizard');

const app = Router();

const steps = require('./steps');
const fields = require('./fields');
app.use(wizard(steps, fields, {
    journeyName: 'invalidation',
    name: 'invalidation1',
    templatePath: 'pages/invalidation',
    editBackStep: 'done'
}));

module.exports = app;
