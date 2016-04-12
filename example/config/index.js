'use strict';

var _ = require('underscore');

/* eslint-disable no-process-env */
module.exports = _.extend({
  API_URL: 'http://localhost:3000/api',
  PORT: 3000
}, process.env);
/* eslint-enable no-process-env */
