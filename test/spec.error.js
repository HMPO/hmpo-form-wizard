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
            let options = { type: 'errortype', errorGroup: 'group', redirect: '/redir', message: 'message override', headerMessage: 'header message override' };
            let error = new ErrorClass('key', options, req, res);
            error.key.should.equal('key');
            error.type.should.equal('errortype');
            error.errorGroup.should.equal('group');
            error.redirect.should.equal('/redir');
            error.message.should.equal('message override');
            error.headerMessage.should.equal('header message override');
        });

        it('should allow being called with no options', () => {
            let error = new ErrorClass('key');
            error.key.should.equal('key');
            error.type.should.equal('default');
        });

        it('should allow being called with no key but options', () => {
            let error = new ErrorClass(null, { key: 'key' });
            error.key.should.equal('key');
            error.type.should.equal('default');
        });

        it('should set the req url to the error', () => {
            let error = new ErrorClass('key', {}, req, res);
            error.url.should.equal('/url');
        });

        it('populates args with first validator argument', () => {
            let error = new ErrorClass('key', { type: 'maxlength', arguments: [10] }, req);
            error.args.should.eql({ maxlength: 10 });
        });

        it('populates args with only validator argument', () => {
            let error = new ErrorClass('key', { type: 'maxlength', arguments: '10' }, req);
            error.args.should.eql({ maxlength: '10' });
        });
    });

});
