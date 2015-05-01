var util = require('util');

var Controller = require('hmpo-form-wizard').Controller;

var Start = function () {
    Controller.apply(this, arguments);
}

util.inherits(Start, Controller);

Start.prototype.saveValues = function (req, res, callback) {
    req.sessionModel.reset();
    callback();
}

module.exports = Start;
