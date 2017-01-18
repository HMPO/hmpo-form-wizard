'use strict';

module.exports = Controller => class extends Controller {

    middlewareSetup() {
        super.middlewareSetup();
        // This is used as early as possible so the base URL can be used in error pages
        this.use(this.setBaseUrlLocal);
    }

    setBaseUrlLocal(req, res, next) {
        res.locals.baseUrl = req.baseUrl;
        next();
    }

};
