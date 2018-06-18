'use strict';

const ErrorClass = require('../lib/error');

describe('Error', () => {
    let req, res;

    describe('constructor', () => {
        beforeEach(() => {
            req = {
                path: '/url'
            };
            res = {};
        });

        it('should set key and options to the class', () => {
            let options = { type: 'errortype', errorGroup: 'group' };
            let error = new ErrorClass('key', options, req, res);
            error.key.should.equal('key');
            error.type.should.equal('errortype');
            error.errorGroup.should.equal('group');
        });

        it('should allow being called with no options', () => {
            let error = new ErrorClass('key');
            error.key.should.equal('key');
            error.type.should.equal('default');
        });

        it('should set the req url to the error', () => {
            let error = new ErrorClass('key', {}, req, res);
            error.url.should.equal('/url');
        });

    });

    describe('getMessage', () => {

        beforeEach(() => {
            req = request({
                translate: sinon.stub().returnsArg(0)
            });
            res = response();
        });

        it('uses the message from the options', () => {
            let error = new ErrorClass('key', { type: 'required', message: 'options error message' }, req);
            error.message.should.equal('options error message');
        });

        it('uses the translate method from the initialising request to translate the message (field block)', () => {
            req.translate.withArgs('fields.key.validation.required').returns('This field is required');
            req.translate.withArgs('validation.key.required').returns('Not this message');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('This field is required');
        });

        it('uses the translate method from the initialising request to translate the message (validation block)', () => {
            req.translate.withArgs('validation.key.required').returns('This field is required');
            req.translate.withArgs('validation.key.default').returns('Not this message');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('This field is required');
        });

        it('uses default error message for field if no field and type specific message is defined (field block)', () => {
            req.translate.withArgs('validation.key.default').returns('Default field message');
            req.translate.withArgs('validation.required').returns('Not this message');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Default field message');
        });

        it('uses default error message for field if no field and type specific message is defined (validation block)', () => {
            req.translate.withArgs('fields.key.validation.default').returns('Default field message');
            req.translate.withArgs('validation.key.default').returns('Not this message');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Default field message');
        });

        it('uses default error message for validation type if no field level message is defined', () => {
            req.translate.withArgs('validation.required').returns('Default required message');
            req.translate.withArgs('validation.default').returns('Not this message');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Default required message');
        });

        it('uses global default error message if no type of field level messages are defined', () => {
            req.translate.withArgs('validation.default').returns('Global default');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Global default');
        });

        it('populates messages with field label', () => {
            req.translate.withArgs('validation.key.required').returns('Your {{label}} is required');
            req.translate.withArgs('fields.key.label').returns('Field label');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Your field label is required');
        });

        it('populates messages with legend', () => {
            req.translate.withArgs('validation.key.required').returns('Your {{legend}} is required');
            req.translate.withArgs('fields.key.legend').returns('date');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.message.should.equal('Your date is required');
        });

        it('sets labels and legends using a contentKey if specified', () => {
            req.translate.withArgs('fields.mykey.label').returns('My Label');
            req.translate.withArgs('fields.mykey.legend').returns('My legend');
            req.translate.withArgs('validation.mykey.required').returns('Field label is {{label}} and legend is {{legend}}');
            let error = new ErrorClass('key', { type: 'required', contentKey: 'mykey' }, req, res);
            error.message.should.equal('Field label is my label and legend is my legend');
        });

        it('populates maxlength messages with the maximum length', () => {
            req.translate.withArgs('validation.key.maxlength').returns('This must be less than {{maxlength}} characters');
            let error = new ErrorClass('key', { type: 'maxlength', arguments: [10] }, req);
            error.message.should.equal('This must be less than 10 characters');
        });

        it('populates minlength messages with the minimum length', () => {
            req.translate.withArgs('validation.key.minlength').returns('This must be no more than {{minlength}} characters');
            let error = new ErrorClass('key', { type: 'minlength', arguments: [10] }, req);
            error.message.should.equal('This must be no more than 10 characters');
        });

        it('populates exactlength messages with the required length', () => {
            req.translate.withArgs('validation.key.exactlength').returns('This must be {{exactlength}} characters');
            let error = new ErrorClass('key', { type: 'exactlength', arguments: [10] }, req);
            error.message.should.equal('This must be 10 characters');
        });

        it('populates past messages with the required difference', () => {
            req.translate.withArgs('validation.key.past').returns('This must be less than {{age}} ago');
            let error = new ErrorClass('key', { type: 'past', arguments: [5, 'days'] }, req);
            error.message.should.equal('This must be less than 5 days ago');
        });

        it('populates custom messages with the required variable', () => {
            req.translate.withArgs('validation.key.custom').returns('This must be {{custom}}');
            let error = new ErrorClass('key', { type: 'custom', arguments: ['dynamic'] }, req);
            error.message.should.equal('This must be dynamic');
        });

        it('populates messages with values from `res.locals` when present', () => {
            req.translate.withArgs('validation.key.required').returns('This must be a {{something}}');
            res.locals.something = 'value';
            let error = new ErrorClass('key', { type: 'required' }, req, res);
            error.message.should.equal('This must be a value');
        });

        it('should set a contentKey if one is given in error options', () => {
            req.translate.withArgs('validation.mykey.required').returns('result');
            let error = new ErrorClass('key', { type: 'required', contentKey: 'mykey' }, req, res);
            error.message.should.equal('result');
        });

        it('should use a contentKey if one is given in field options', () => {
            req.form = {
                options: {
                    fields: {
                        'key': { contentKey: 'mykey' }
                    }
                }
            };
            req.translate.withArgs('validation.mykey.required').returns('result');
            let error = new ErrorClass('key', { type: 'required' }, req, res);
            error.message.should.equal('result');
        });

        it('uses identity function if no req.translate is defined', () => {
            delete req.translate;
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.translate('test').should.equal('test');
            expect(error.message).to.equal(null);
        });

        it('uses the header message from the options', () => {
            let error = new ErrorClass('key', { type: 'required', headerMessage: 'options header error message' }, req);
            error.headerMessage.should.equal('options header error message');
        });

        it('uses the translate method for the header error message', () => {
            req.translate.withArgs('fields.key.validation.required_header').returns('This field is required');
            let error = new ErrorClass('key', { type: 'required' }, req);
            error.headerMessage.should.equal('This field is required');
        });

        it('uses the standard message as the header message if there is no header message', () => {
            let error = new ErrorClass('key', { type: 'required', message: 'options error message' }, req);
            error.headerMessage.should.equal('options error message');
        });

    });

});
