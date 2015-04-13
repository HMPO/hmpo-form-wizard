var _ = require('underscore'),
    sinon = require('sinon');

module.exports = function (settings) {
    var defaults = {
        locals: sinon.stub(),
        cookie: sinon.stub()
    };
    return _.extend({}, defaults, settings);
};
