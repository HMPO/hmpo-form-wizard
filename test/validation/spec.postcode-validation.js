'use strict';

const validators = require('../../lib/validation').validators;

const PostcodeData = require('../helpers/postcodes');

const isCoverageTest = require.cache[require.resolve('istanbul')];
const describeUnlessCoverage = isCoverageTest ? describe.skip : describe;

describe('Postcode validation', () => {

    it('correctly validates empty string', () => {
        validators.postcode('').should.be.ok;
    });

    it('correctly rejects invalid postcodes', () => {
        validators.postcode('A11AA A11AA').should.not.be.ok;
        validators.postcode('N443 6DFG').should.not.be.ok;
        validators.postcode('ABCD1234').should.not.be.ok;
    });

    describeUnlessCoverage('Full postcode test - loads full UK postcode database, may take some time', function () {
        this.timeout(40000);
        this.slow(20000);

        let testData;

        function test(pc) {
            try {
                validators.postcode(pc).should.be.ok;
            } catch (e) {
                // echo out the failing postcode
                global.console.error('Failed postcode:', pc);
                throw e;
            }
        }

        before(done => {
            PostcodeData.load((err, data) => {
                testData = data;
                done(err);
            });
        });

        it('correctly validates uk postcodes with a single space', () => {
            testData.forEach(testPostcode => {
                let pc = testPostcode.replace(/ \s+/, ' ');
                test(pc);
            });
        });

        it('correctly validates uk postcodes with no spaces', () => {
            testData.forEach(testPostcode => {
                let pc = testPostcode.replace(/\s+/g, '');
                test(pc);
            });
        });
    });

});
