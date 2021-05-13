'use strict';

const { Router } = require('express');
const wizard = require('hmpo-form-wizard');
const steps = require('./steps');
const fields = require('./fields');

const app = Router();

app.use(wizard(steps, fields, {
    name: 'basic',
    templatePath: 'pages/basic'
}));

module.exports = app;
