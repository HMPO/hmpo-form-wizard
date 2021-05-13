'use strict';

const { Router } = require('express');
const wizard = require('hmpo-form-wizard');

const app = Router();

const steps1 = require('./steps1');
const fields1 = require('./fields1');
app.use(wizard(steps1, fields1, {
    journeyName: 'multiwizard',
    name: 'multiwizard1',
    templatePath: 'pages/multiwizard'
}));

const steps2 = require('./steps2');
const fields2 = require('./fields2');
app.use(wizard(steps2, fields2, {
    journeyName: 'multiwizard',
    name: 'multiwizard2',
    templatePath: 'pages/multiwizard'
}));

module.exports = app;
