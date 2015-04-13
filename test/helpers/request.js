var _ = require('underscore');

module.exports = function (settings) {
    var defaults = {
        method: 'GET',
        url: '/',
        session: {},
        cookies: {}
    };
    return _.extend({}, defaults, settings);
};
