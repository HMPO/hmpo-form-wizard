'use strict';

const validators = require('../../lib/validation').validators;

const postcodes = require('../fixtures/postcodes');

describe('Postcode validation', () => {

    it('correctly validates empty string', () => {
        validators.postcode('').should.be.ok;
    });

    it('correctly rejects invalid postcodes', () => {
        validators.postcode('A11AA A11AA').should.not.be.ok;
        validators.postcode('N443 6DFG').should.not.be.ok;
        validators.postcode('ABCD1234').should.not.be.ok;
    });

    describe('Random postcode test', function () {

        function test(pc) {
            try {
                validators.postcode(pc).should.be.ok;
            } catch (e) {
                // echo out the failing postcode
                global.console.error('Failed postcode:', pc);
                throw e;
            }
        }

        it('correctly validates uk postcodes with a single space', () => {
            postcodes.forEach(testPostcode => {
                let pc = testPostcode.replace(/ \s+/, ' ');
                test(pc);
            });
        });

        it('correctly validates uk postcodes with no spaces', () => {
            postcodes.forEach(testPostcode => {
                let pc = testPostcode.replace(/\s+/g, '');
                test(pc);
            });
        });
    });

});
