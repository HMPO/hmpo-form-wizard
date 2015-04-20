var Controller = require('../lib/controller');

describe('Form Controller', function () {

    var controller, req, res;

    describe('getErrors', function () {

        beforeEach(function () {
            req = request();
            res = {};
            controller = new Controller({
                template: 'index',
                fields: {
                    field1: {},
                    field2: {}
                }
            });

        });

        it('only returns errors from fields relevant to the current step', function () {
            req.sessionModel.set('errors', {
                field1: 'foo',
                field3: 'bar'
            });
            var errors = controller.getErrors(req, res);
            errors.should.eql({ field1: 'foo' });
        });

    });

});