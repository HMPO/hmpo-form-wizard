'use strict';

var util = require('util');
var Model = require('hmpo-model');

var Submit = function Submit(attrs, options) {
  Model.call(this, attrs, options);
};

util.inherits(Submit, Model);

Submit.prototype.url = function url() {
  return require('../config').API_URL;
};

Submit.prototype.save = function save(callback) {
  /* eslint-disable no-console */
  console.log('Saving model data to ' + this.url() + ':');
  console.log(this.toJSON());
  /* eslint-enable no-console */
  Model.prototype.save.call(this, callback);
};

module.exports = Submit;
