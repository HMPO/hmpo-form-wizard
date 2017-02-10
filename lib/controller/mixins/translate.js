'use strict';

module.exports = Controller => class extends Controller {

    middlewareSetup() {
        super.middlewareSetup();
        this.use(this.setTranslateEngine);
    }

    setTranslateEngine(req, res, next) {
        if (typeof req.form.options.translate === 'function') {
            req.translate = req.form.options.translate;
        }
        next();
    }

};
