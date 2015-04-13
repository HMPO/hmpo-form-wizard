var deprecate = require('depd')('hmpo-form-wizard');

var WARNING = 'session is undefined. Falling back to express-session - not supported for production use.';
var session = require('express-session')({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
});

module.exports = function (req, res, next) {
    if (typeof req.session === 'undefined') {
        deprecate(WARNING);
        require('cookie-parser')()(req, res, function () {
            session(req, res, next);
        });
    } else {
        next();
    }
};
