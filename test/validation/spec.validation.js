'use strict';

const validation = require('../../lib/validation');

describe('validation', () => {

    it('exports the validate function', () => {
        validation.validate.should.be.a('function');
    });

    it('exports a list of validator functions indexed by name', () => {
        validation.validators.should.be.an('object');
        validation.validators.required.should.be.a('function');
        validation.validators.required.name.should.equal('required');
    });

    describe('isAllowedDependent', () => {
        let fields, values, result;

        beforeEach(() => {
            fields = {
                'field-1': {
                },
                'field-2': {
                },
                'field-3': {
                    dependent: 'field-2'
                }
            };
            values = {
                'field-1': 'abc',
                'field-2': 'def',
                'field-3': 'hij'
            };
        });

        it('returns false if field does not exist', () => {
            result = validation.isAllowedDependent(fields, 'field-99', values);
            result.should.be.false;
        });

        it('returns true if there is no dependent field', () => {
            result = validation.isAllowedDependent(fields, 'field-1', values);
            result.should.be.true;
        });

        it('returns true if there is a dependent field that matches the value', () => {
            values['field-2'] = true;
            result = validation.isAllowedDependent(fields, 'field-3', values);
            result.should.be.true;
        });

        it('returns true if there is a dependent field thatdoes not matches the value', () => {
            values['field-2'] = false;
            result = validation.isAllowedDependent(fields, 'field-3', values);
            result.should.be.false;
        });

        it('returns true if one of the field values matches one of the field values', () => {
            fields['field-3'].dependent = { field: 'field-2', value: ['c', 'd', 'e'] };
            values['field-2'] = ['a', 'b', 'c'];
            result = validation.isAllowedDependent(fields, 'field-3', values);
            result.should.be.true;
        });

        it('returns false if none of the field values matches any of the field values', () => {
            fields['field-3'].dependent = { field: 'field-2', value: ['x', 'y', 'z'] };
            values['field-2'] = ['a', 'b', 'c'];
            result = validation.isAllowedDependent(fields, 'field-3', values);
            result.should.be.false;
        });
    });

    describe('built-in validators', () => {
        let fields, error;

        beforeEach(() => {
            fields = {
                'field-1': {
                    validate: 'required'
                },
                'field-2': {
                    validate: [
                        'required',
                        { type: 'regex', arguments: /^fo+$/ }
                    ]
                },
                'field-3': {
                    validate: { type: 'minlength', arguments: 20 }
                },
                'field-4': {
                    errorGroup: 'group',
                    validate: { type: 'minlength', arguments: 20 }
                }
            };
        });

        it('returns no error if field does not exist', () => {
            error = validation.validate(fields, 'field-99');
            error.should.be.false;
        });

        it('returns an error if a built-in validator fails', () => {
            error = validation.validate(fields, 'field-1', 'present');
            expect(error).to.be.undefined;

            error = validation.validate(fields, 'field-1');
            error.should.have.property('type')
                .and.be.equal('required');
            error.should.have.property('key')
                .and.be.equal('field-1');
        });

        it('returns an error if a first built-in validator fails', () => {
            fields['field-1'].validate = ['required', 'string'];
            error = validation.validate(fields, 'field-1', 'present');
            expect(error).to.be.undefined;

            error = validation.validate(fields, 'field-1');
            error.should.have.property('type')
                .and.be.equal('required');
            error.should.have.property('key')
                .and.be.equal('field-1');
        });


        it('returns an error if a validator fails for one item in an array', () => {
            error = validation.validate(fields, 'field-1', ['present', '', 'also present']);
            error.should.have.property('type')
                .and.be.equal('required');
            error.should.have.property('key')
                .and.be.equal('field-1');
        });

        it('passes arguments to error', () => {
            error = validation.validate(fields, 'field-2', 'foo');
            expect(error).to.be.undefined;

            error = validation.validate(fields, 'field-2', 'bar');
            error.should.have.property('type')
                .and.be.equal('regex');
            error.should.have.property('key')
                .and.be.equal('field-2');
        });

        it('passes errorGroup to error', () => {
            error = validation.validate(fields, 'field-4', 'foo');
            error.should.have.property('errorGroup')
                .and.be.equal('group');
        });

        it('passes arguments as an array to error', () => {
            error = validation.validate(fields, 'field-3', 'foo');
            error.should.have.property('type')
                .and.be.equal('minlength');
            error.should.have.property('arguments')
                .and.eql([20]);
        });

        it('throws and error if an unknown validator is specified', () => {
            fields = {
                field: { validate: 'unknown' }
            };
            expect(() => {
                validation.validate(fields, 'field', 'value');
            }).to.throw('Undefined validator: unknown');
        });

        it('adds an equality validator if field has options defined', () => {
            fields = {
                'field': {
                    options: [ 'number', 'one', 'two', 'three' ]
                }
            };

            validation.validate(fields, 'field');
            fields.field.validate.should.have.length(1);
            fields.field.validate[0].type.should.equal('equal');
            fields.field.validate[0].arguments.should.deep.equal([ 'number', 'one', 'two', 'three' ]);
        });

        it('adds an equality validator if field has items defined', () => {
            fields = {
                'field': {
                    items: [ 'number', 'one', 'two', 'three' ]
                }
            };

            validation.validate(fields, 'field');
            fields.field.validate.should.have.length(1);
            fields.field.validate[0].type.should.equal('equal');
            fields.field.validate[0].arguments.should.deep.equal([ 'number', 'one', 'two', 'three' ]);
        });

        it('adds an equality validator if field has complex options defined', () => {
            fields = {
                'field': {
                    options: [ { value: 'number' }, { value: 'one' }, { value: 'two' }, { value: 'three' } ]
                }
            };

            validation.validate(fields, 'field');
            fields.field.validate.should.have.length(1);
            fields.field.validate[0].type.should.equal('equal');
            fields.field.validate[0].arguments.should.deep.equal([ 'number', 'one', 'two', 'three' ]);
        });

        it('does not add divider items to the equality validator', () => {
            fields = {
                'field': {
                    items: [ 'number', 'one', { divider: 'or' }, 'two', 'three' ]
                }
            };

            validation.validate(fields, 'field');
            fields.field.validate.should.have.length(1);
            fields.field.validate[0].type.should.equal('equal');
            fields.field.validate[0].arguments.should.deep.equal([ 'number', 'one', 'two', 'three' ]);
        });

        it('should not add the options validator twice', () => {
            fields = {
                'field': {
                    options: [ 'number', 'one', 'two', 'three' ]
                }
            };

            validation.validate(fields, 'field', 'present');
            validation.validate(fields, 'field', 'present');

            fields.field.validate.should.have.length(1);
        });
    });

    describe('custom validators', () => {
        let fields;

        beforeEach(() => {
            fields = {
                'field-1': {
                    validate: function doSomething() {
                        return true;
                    }
                },
                'field-2': {
                    validate: () => true
                },
                'field-2b': {
                    validate: {
                        fn: () => true
                    }
                },
                'field-2c': {
                    validate: {
                        fn: () => true,
                        type: 'named'
                    }
                },
                'field-3': {
                    validate: function fail() {
                        return false;
                    }
                },
                'field-4': {
                    validate: function checkVal(val) {
                        return val === true;
                    }
                },
                'field-5': {
                    validate: {
                        fn: function hasArgs(val, arg1, arg2) {
                            return val === arg1 + arg2;
                        },
                        arguments: ['abc', 'def']
                    }
                }
            };
        });

        it('accepts custom validators', () => {
            let error = validation.validate(fields, 'field-1', null);
            expect(error).to.be.undefined;
        });

        it('throws an error if an anonymous function is passed', () => {
            expect(
                () => validation.validate(fields, 'field-2')
            ).to.throw(
                'Custom validator needs to be a named function'
            );
        });

        it('throws an error if an anonymous function is passed as fn', () => {
            expect(
                () => validation.validate(fields, 'field-2b')
            ).to.throw(
                'Custom validator needs to be a named function'
            );
        });

        it('does not throw an error if an anonymous function has a type', () => {
            expect(
                () => validation.validate(fields, 'field-2c')
            ).to.not.throw();
        });

        it('uses the name of the function as the error type', () => {
            let error = validation.validate(fields, 'field-3');
            error.should.have.property('type')
                .and.be.equal('fail');
            error.should.have.property('key')
                .and.be.equal('field-3');
        });

        it('validates using the passed values', () => {
            let error = validation.validate(fields, 'field-4', true);
            expect(error).to.be.undefined;
        });

        it('passes arguments to custom validators', () => {
            let error;
            error = validation.validate(fields, 'field-5', 'abcdef');
            expect(error).to.be.undefined;

            error = validation.validate(fields, 'field-5', 'xxxxxx');
            error.should.have.property('type')
                .and.be.equal('hasArgs');
            error.should.have.property('key')
                .and.be.equal('field-5');
        });
    });

});
