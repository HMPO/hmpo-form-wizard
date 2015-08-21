var ErrorClass = require('../lib/error');

describe('Error', function () {

    var req;

    beforeEach(function () {
        req = request({
            translate: sinon.stub().returnsArg(0)
        });
    });

    describe('getMessage', function () {

        it('uses the translate method from the initialising request to translate the message', function () {
            req.translate.withArgs('validation.key.required').returns('This field is required');
            var error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('This field is required');
        });

        it('uses default error message for field if no field and type specific message is defined', function () {
            req.translate.withArgs('validation.key.default').returns('Default field message');
            var error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Default field message');
        });

        it('uses default error message for validation type if no field level message is defined', function () {
            req.translate.withArgs('validation.required').returns('Default required message');
            var error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Default required message');
        });

        it('uses global default error message if no type of field level messages are defined', function () {
            req.translate.withArgs('validation.default').returns('Global default');
            var error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Global default');
        });

        it('populates messages with field label', function () {
            req.translate.withArgs('validation.key.required').returns('Your {{label}} is required');
            req.translate.withArgs('fields.key.label').returns('Field label');
            var error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Your field label is required');
        });

        it('populates maxlength messages with the maximum length', function () {
            req.translate.withArgs('validation.key.maxlength').returns('This must be less than {{maxlength}} characters');
            var error = new ErrorClass('key', { type: 'maxlength', arguments: [10] }, req);
            error.message.should.equal('This must be less than 10 characters');
        });

        it('populates minlength messages with the minimum length', function () {
            req.translate.withArgs('validation.key.minlength').returns('This must be no more than {{minlength}} characters');
            var error = new ErrorClass('key', { type: 'minlength', arguments: [10] }, req);
            error.message.should.equal('This must be no more than 10 characters');
        });

        it('populates exactlength messages with the required length', function () {
            req.translate.withArgs('validation.key.exactlength').returns('This must be {{exactlength}} characters');
            var error = new ErrorClass('key', { type: 'exactlength', arguments: [10] }, req);
            error.message.should.equal('This must be 10 characters');
        });

        it('populates past messages with the required difference', function () {
            req.translate.withArgs('validation.key.past').returns('This must be less than {{age}} ago');
            var error = new ErrorClass('key', { type: 'past', arguments: [5, 'days'] }, req);
            error.message.should.equal('This must be less than 5 days ago');
        });

        it('uses own translate method if no req.translate is defined', function () {
            delete req.translate;
            sinon.stub(ErrorClass.prototype, 'translate').returns('Custom translate');
            var error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Custom translate');
            ErrorClass.prototype.translate.restore();
        });

    });

});
