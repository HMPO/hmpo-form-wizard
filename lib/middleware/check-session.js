module.exports = function (route, controller, steps, first) {
    return function checkSession(req, res, next) {
        if (req.method === 'POST' || req.path !== first) {
            if (req.cookies['pex-sc'] && req.session.exists !== true) {
                return next({ code: 'SESSION_TIMEOUT' });
            }
        }
        req.session.exists = true;
        res.cookie('pex-sc', 1);
        next();
    };
};
