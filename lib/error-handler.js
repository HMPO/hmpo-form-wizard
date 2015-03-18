var path = require('path');

module.exports = function (first) {

    return function (err, req, res, next) {
        if (err.code === 'SESSION_TIMEOUT') {
            res.render(path.resolve(__dirname, '../views/errors/session-timeout'), { index: first });
        } else {
            next(err);
        }
    };

};