var util = require('util'),
    EventEmitter = require('events').EventEmitter;

module.exports = function (options) {

    options = options || {};
    options.constructor = options.constructor || function () {};
    options.requestHandler = options.requestHandler || function () {};

    var Controller = function () {
        this.options = {};
        options.constructor.apply(null, arguments);
    };

    util.inherits(Controller, EventEmitter);

    Controller.prototype.requestHandler = function () {
        return options.requestHandler;
    };

    Controller.prototype.use = sinon.stub();

    return Controller;

};
