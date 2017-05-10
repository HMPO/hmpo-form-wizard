'use strict';

const express = require('express');
const templateMixins = require('hmpo-template-mixins');
const wizard = require('../../../');
const steps = require('./steps');
const fields = require('./fields');

let app = express.Router();

app.use(templateMixins());

app.use(wizard(steps, fields, {
    journeyName: 'branching',
    name: 'branching',
    templatePath: 'pages/branching'
}));

module.exports = app;
