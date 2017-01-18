'use strict';

module.exports = Controller => class extends Controller {

    middlewareSetup() {
        super.middlewareSetup();
        this.use(this.setTranslateEngine);
    }

    setTranslateEngine(req, res, next) {
        if (typeof this.options.translate === 'function') {
            req.translate = this.options.translate;
        }
        next();
    }

};
