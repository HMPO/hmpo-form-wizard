var util = require('util'),
    EventEmitter = require('events').EventEmitter;

module.exports = function (stub) {

    var Controller = function () {
        this.options = {};
    };

    util.inherits(Controller, EventEmitter);

    Controller.prototype.requestHandler = function () {
        return stub;
    };

    return Controller;

};
