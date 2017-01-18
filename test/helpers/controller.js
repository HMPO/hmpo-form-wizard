'use strict';

module.exports = () => {
    class Controller {
        constructor(options) {
            this.options = options || {};
            Controller.constructor.apply(null, arguments);
        }
    }

    Controller.constructor = sinon.stub();

    Controller.prototype.on = sinon.stub();
    Controller.prototype.emit = sinon.stub();
    Controller.prototype.use = sinon.stub();
    Controller.prototype.requestHandler = sinon.stub();
    Controller.prototype.middlewareSetup = sinon.stub();
    Controller.prototype.middlewareChecks = sinon.stub();
    Controller.prototype.middlewareActions = sinon.stub();
    Controller.prototype.middlewareLocals = sinon.stub();

    return Controller;
};
