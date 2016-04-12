'use strict';

module.exports = function checkSession(route, controller, steps, first) {
  return function checkSessionMiddleware(req, res, next) {
    if (controller.options.checkSession !== false && (req.method === 'POST' || req.path !== first)) {
      if (req.cookies['hmpo-wizard-sc'] && req.session.exists !== true) {
        var err = new Error('Session expired');
        err.code = 'SESSION_TIMEOUT';
        return next(err);
      }
    }
    req.session.exists = true;
    res.cookie('hmpo-wizard-sc', 1);
    return next();
  };
};
