/* eslint no-console: 0 */

var util = require('util'),
    Model = require('hmpo-model');

var Submit = function (attrs, options) {
    Model.call(this, attrs, options);
};

util.inherits(Submit, Model);

Submit.prototype.url = function () {
    return require('../config').API_URL;
};

Submit.prototype.save = function (callback) {
    console.log('Saving model data to ' + this.url() + ':');
    console.log(this.toJSON());
    Model.prototype.save.call(this, callback);
};

module.exports = Submit;
