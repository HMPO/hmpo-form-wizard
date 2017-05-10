'use strict';

const express = require('express');
const templateMixins = require('hmpo-template-mixins');
const wizard = require('../../../');

let app = express.Router();

app.use(templateMixins());

const steps1 = require('./steps1');
const fields1 = require('./fields1');
app.use(wizard(steps1, fields1, {
    journeyName: 'invalidation',
    name: 'invalidation1',
    controller: require('../../controllers/question'),
    templatePath: 'pages/invalidation'
}));

const steps2 = require('./steps2');
const fields2 = require('./fields2');
app.use(wizard(steps2, fields2, {
    journeyName: 'invalidation',
    name: 'invalidation2',
    templatePath: 'pages/invalidation'
}));

module.exports = app;
