'use strict';

const validation = require('../../lib/validation');
const validators = validation.validators;
const _ = require('underscore');

function testName(input) {
    if (_.isArray(input)) {
        return testName(input[0]) + ' with args: ' + input.slice(1);
    } else {
        return typeof input + ' ' + input;
    }
}

describe('validators', () => {

    let clock;

    beforeEach(() => {
        let now = new Date('2014-11-05T15:09:00Z');
        clock = sinon.useFakeTimers(now.getTime());
    });

    afterEach(() => {
        clock.restore();
    });

    describe('required', () => {

        describe('invalid values', () => {
            let inputs = [
                undefined,
                ''
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.required(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                true,
                false,
                1,
                0,
                'a'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.required(i).should.be.ok;
                });
            });
        });

    });

    describe('email', () => {

        describe('invalid values', () => {
            let inputs = [
                10,
                null,
                'asdf.com',
                'asdf.',
                'asdf@com.',
                'asdf@.com.',
                '@.com',
                '@com.',
                'test.com@',
                'test@test@test.com'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.email(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                't@i.co',
                'test@example.com',
                'test+suffix@gmail.com',
                'test+suffix@digital.cabinet-office.gov.uk',
                'test.suffix@digital.cabinet-office.gov.uk'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.email(i).should.be.ok;
                });
            });
        });

    });

    describe('minlength', () => {

        describe('invalid values', () => {
            let inputs = [
                [undefined, 1],
                [100, 1],
                ['asdf', 10],
                ['asdf', 5]
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.minlength.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                ['', 9],
                ['asdfasdfasdf', 10],
                ['t']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.minlength.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('maxlength', () => {

        describe('invalid values', () => {
            let inputs = [
                [undefined, 1],
                [100, 10],
                ['asdfasdfasdf', 10],
                ['asdf', 3],
                ['t']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.maxlength.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                ['', 9],
                ['asdfasdf', 10],
                ['123', 4]
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.maxlength.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('exactlength', () => {

        describe('invalid values', () => {
            let inputs = [
                [undefined, 9],
                ['123', 2],
                ['123', 4]
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.exactlength.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                ['', 9],
                ['123', 3]
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.exactlength.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('equal', () => {

        describe('invalid values', () => {
            let inputs = [
                ['1', 1],
                [true, 'true'],
                [0, '0'],
                ['a', 'b', 'c', 'd'],
                ['a'],
                [['a', 'b', 'c'], 'a', 'b']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.equal.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                ['', 'Adam Smith'],
                ['John Smith', 'John Smith'],
                [10, 10],
                [true, true],
                ['a', 'b', 'c', 'a'],
                [['a', 'b'], 'a', 'b']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.equal.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('phonenumber', () => {

        describe('invalid values', () => {
            let inputs = [
                123,
                'abc',
                'abc123',
                '123+456',
                '(0)+123456',
                '0123456789123456'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.phonenumber(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '123',
                '123456',
                '1234567890',
                '+1234567890',
                '(+12)34567890',
                '123-456-789',
                '012345678912345'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.phonenumber(i).should.be.ok;
                });
            });
        });

    });

    describe('ukmobilephone', () => {

        describe('invalid values', () => {
            let inputs = [
                '+447812123456',
                '+4407812123456',
                '+44(0)7812123456',
                '447812123456',
                '0781212345',
                '078121234567',
                '07812 123 456',
                '07812-123-456',
                '07812/123/456',
                '(07812)123456',
                'mymobile',
                '078121223456',
                78121223456
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.ukmobilephone(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '07812123456'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.ukmobilephone(i).should.be.ok;
                });
            });
        });

    });

    describe('date', () => {

        describe('invalid values', () => {
            let inputs = [
                'abc',
                '1981-02-29',
                '1981-13-29',
                '1981-00-00',
                '1980/01/01',
                '2000-02-'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.date(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '1980-02-29'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.date(i).should.be.ok;
                });
            });
        });

    });

    describe('date-year', () => {

        describe('invalid values', () => {
            let inputs = [
                '01',
                'abc',
                'ABC123',
                '2oo5',
                '-2015',
                2015,
                -2015
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators['date-year'](i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '0000',
                '0001',
                '2015',
                '9999'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators['date-year'](i).should.be.ok;
                });
            });
        });

    });

    describe('date-month', () => {

        describe('invalid values', () => {
            let inputs = [
                '0',
                '13',
                'Jan',
                '1',
                '-1',
                1,
                -12
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators['date-month'](i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '01',
                '12'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators['date-month'](i).should.be.ok;
                });
            });
        });

    });

    describe('date-day', () => {

        describe('invalid values', () => {
            let inputs = [
                '0',
                '32',
                '001',
                '-1',
                1,
                -10
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators['date-day'](i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '01',
                '28',
                '29',
                '30',
                '31'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators['date-day'](i).should.be.ok;
                });
            });
        });

    });

    describe('before', () => {

        // note date is set to 2014-11-05T15:09:00Z in all tests

        describe('invalid values', () => {
            let inputs = [
                '2014-11-06',
                ['2014-12-16', '2014-12-16'],
                ['2013-12-16', '2013-12-15'],
                ['2014-11-05', 1, 'day'],
                ['1993-11-06', 21],
                ['1993-11-06', 21, 'years'],
                ['2013-09-01', 1, 'year', 3, 'months'],
                ['2016-03-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    if (typeof i === 'string') {
                        validators.before(i).should.not.be.ok;
                    } else {
                        validators.before.apply(null, i).should.not.be.ok;
                    }
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '1980-02-29',
                '2014-11-05',
                ['2014-12-15', '2014-12-16'],
                ['2014-11-04', 1, 'day'],
                ['1993-11-05', 21],
                ['1993-11-05', 21, 'years'],
                ['2013-07-01', 1, 'year', 3, 'months'],
                ['2016-01-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    if (typeof i === 'string') {
                        validators.before(i).should.be.ok;
                    } else {
                        validators.before.apply(null, i).should.be.ok;
                    }
                });
            });
        });

    });

    describe('after', () => {

        // note date is set to 2014-11-05T15:09:00Z in all tests

        describe('invalid values', () => {
            let inputs = [
                '2014-11-05',
                ['2014-12-16', '2014-12-16'],
                ['2013-12-15', '2013-12-16'],
                ['2014-11-04', 1, 'day'],
                ['1993-11-05', 21, 'years'],
                ['1993-11-05', 21],
                ['2013-07-01', 1, 'year', 3, 'months'],
                ['2016-01-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    if (typeof i === 'string') {
                        validators.after(i).should.not.be.ok;
                    } else {
                        validators.after.apply(null, i).should.not.be.ok;
                    }
                });
            });
        });

        describe('valid inputs', () => {
            let inputs = [
                ['', '2014-12-15'],
                ['2014-12-16', '2014-12-15'],
                ['2014-11-05', 1, 'day'],
                ['1993-11-06', 21, 'years'],
                ['1993-11-06', 21],
                ['2013-09-01', 1, 'year', 3, 'months'],
                ['2016-03-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.after.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('alphanum', () => {

        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                9,
                '-.'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphanum(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                'abc123',
                'ABC123'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphanum(i).should.be.ok;
                });
            });
        });

    });

    describe('alphanumex', () => {
        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                9,
                '&',
                '/',
                '\\',
                '@',
                '!'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphanumex(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                'ABCabc123 .,-\'',
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphanumex(i).should.be.ok;
                });
            });
        });
    });

    describe('alphanumex1', () => {
        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                9,
                '\\',
                '@',
                '!'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphanumex1(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                'ABCabc123 .,-\'&/',
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphanumex1(i).should.be.ok;
                });
            });
        });
    });

    describe('alpha', () => {

        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                9,
                '-',
                '.',
                ',',
                '\'',
                'a1'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alpha(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                'abc',
                'ABC'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alpha(i).should.be.ok;
                });
            });
        });

    });

    describe('alphex', () => {
        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                9,
                '&',
                '/',
                '\\',
                '@',
                '!',
                '123'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphaex(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                'ABCabc .,-\'',
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphaex(i).should.be.ok;
                });
            });
        });
    });

    describe('alphaex1', () => {
        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                9,
                '\\',
                '&',
                '/',
                '@',
                '.',
                ',',
                '!'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphaex1(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                'ABCabc -\'',
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.alphaex1(i).should.be.ok;
                });
            });
        });
    });

    describe('numeric', () => {

        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                true,
                0,
                'a'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.numeric(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                '1'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.numeric(i).should.be.ok;
                });
            });
        });

    });

    describe('postcode', () => {

        describe('invalid values', () => {
            let inputs = [
                null,
                undefined,
                true,
                0,
                '123ABC',
                'Y04 2BA',
                'W14F 7BB',
                'YO1234BB',
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.postcode(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', () => {
            let inputs = [
                '',
                'AB1 2BU',
                'W1F 7BB',
                'BA10 4DD',
                'NW11AA',
                'BX43BT'
            ];
            _.each(inputs, i => {
                it(testName(i), () => {
                    validators.postcode(i).should.be.ok;
                });
            });
        });

    });

    describe('match', () => {
        it('matches another field', () => {
            let context = {
                values: {
                    fieldname: 'a value'
                }
            };
            validators.match.call(context, 'a value', 'fieldname').should.be.ok;
        });

        it('matches a session field', () => {
            let context = {
                sessionModel: {
                    get: sinon.stub().withArgs('fieldname').returns('a value')
                }
            };
            validators.match.call(context, 'a value', 'fieldname', true).should.be.ok;
        });

        it('should return false if value doesn\'t match', () => {
            let context = {
                values: {
                    fieldname: 'different'
                }
            };
            validators.match.call(context, 'a value', 'fieldname').should.not.be.ok;
        });

        it('return false if it doesn\'t match a session field', () => {
            let context = {
                sessionModel: {
                    get: sinon.stub()
                }
            };
            validators.match.call(context, 'a value', 'fieldname', true).should.not.be.ok;
        });

        it('should return false if field isn\'t set', () => {
            let context = {
                values: {
                }
            };
            validators.match.call(context, 'a value', 'fieldname').should.not.be.ok;
        });
    });

    describe('beforeField', () => {
        it('should return true if value is before field', () => {
            let context = {
                values: {
                    fieldname: '2014-11-06'
                }
            };
            validators.beforeField.call(context, '2014-11-05', 'fieldname').should.be.ok;
        });

        it('should return true if value is before session field', () => {
            let context = {
                sessionModel: {
                    get: sinon.stub().withArgs('fieldname').returns('2014-11-06')
                }
            };
            validators.beforeField.call(context, '2014-11-05', 'fieldname', true).should.be.ok;
        });

        it('should return false if value is not before field', () => {
            let context = {
                values: {
                    fieldname: '2014-11-05'
                }
            };
            validators.beforeField.call(context, '2014-11-05', 'fieldname').should.not.be.ok;
        });

        it('should return false if field isn\'t set', () => {
            let context = {
                values: {
                }
            };
            validators.beforeField.call(context, '2014-11-05', 'fieldname').should.not.be.ok;
        });
    });

    describe('afterField', () => {
        it('should return true if value is after field', () => {
            let context = {
                values: {
                    fieldname: '2014-11-04'
                }
            };
            validators.afterField.call(context, '2014-11-05', 'fieldname').should.be.ok;
        });

        it('should return true if value is before session field', () => {
            let context = {
                sessionModel: {
                    get: sinon.stub().withArgs('fieldname').returns('2014-11-04')
                }
            };
            validators.afterField.call(context, '2014-11-05', 'fieldname', true).should.be.ok;
        });

        it('should return false if value is not after field', () => {
            let context = {
                values: {
                    fieldname: '2014-11-05'
                }
            };
            validators.afterField.call(context, '2014-11-05', 'fieldname').should.not.be.ok;
        });

        it('should return false if field isn\'t set', () => {
            let context = {
                values: {
                }
            };
            validators.afterField.call(context, '2014-11-05', 'fieldname').should.not.be.ok;
        });
    });
});
