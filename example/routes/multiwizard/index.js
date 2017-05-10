'use strict';

const express = require('express');
const templateMixins = require('hmpo-template-mixins');
const wizard = require('../../../');

let app = express.Router();

app.use(templateMixins());

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
