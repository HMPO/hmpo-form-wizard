'use strict';

module.exports = () => {
    class Controller {
        constructor(options) {
            this.options = options || {};
            // run sinon stub with options of this controller
            Controller.constructor.call(this, options);
        }
    }

    Controller.constructor = sinon.stub();

    Controller.prototype.on = sinon.stub();
    Controller.prototype.emit = sinon.stub();
    Controller.prototype.use = sinon.stub();
    Controller.prototype.router = sinon.stub();
    Controller.prototype.requestHandler = sinon.stub();
    Controller.prototype.editing = sinon.stub();
    Controller.prototype.middlewareSetup = sinon.stub();
    Controller.prototype.middlewareChecks = sinon.stub();
    Controller.prototype.middlewareActions = sinon.stub();
    Controller.prototype.middlewareLocals = sinon.stub();

    return Controller;
};
