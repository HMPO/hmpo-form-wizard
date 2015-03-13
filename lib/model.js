var Model = require('hmpo-model');

var util = require('util'),
    _ = require('underscore');

var SessionModel = function (attrs, options) {
    var session = options.session,
        key = options.key;

    if (!key || typeof key !== 'string') {
        throw new Error('session-model - key must be defined');
    }

    session[key] = session[key] || {};

    // include session values on initialized attributes
    attrs = _.extend({}, session[key], attrs);

    Model.call(this, attrs, options);

    // write changes back to the session
    this.on('change', function (changes) {
        _.extend(session[key], changes);
    });
    this.on('reset', function () {
        session[key] = {};
    });
};

util.inherits(SessionModel, Model);

module.exports = SessionModel;
