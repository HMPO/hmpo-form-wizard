'use strict';

const formatting = require('../../lib/formatting');


describe('Formatting', () => {
    it('exports the format function', () => {
        formatting.format.should.be.a('function');
    });

    it('exports a list of formatter functions indexed by name', () => {
        formatting.formatters.should.be.an('object');
        formatting.formatters.uppercase.should.be.a('function');
    });

    describe('format', () => {
        let fields, value;

        beforeEach(() => {
            fields = {
                field: {}
            };
        });

        it('defaults falsy values to empty strings', () => {
            value = formatting.format(fields, 'field', false);
            value.should.equal('');
        });

        it('defaults falsy value arrays to empty strings', () => {
            value = formatting.format(fields, 'field', [0, false, undefined]);
            value.should.eql(['', '', '']);
        });

        it('should use the default formatters', () => {
            value = formatting.format(fields, 'field', 'value', 'uppercase');
            value.should.eql('VALUE');
        });

        it('should use the default formatters for an array of values', () => {
            value = formatting.format(fields, 'field', ['value 1', 'value 2'], 'uppercase');
            value.should.eql(['VALUE 1', 'VALUE 2']);
        });

        it('should use not the default formatters if the field option is set', () => {
            fields.field['ignore-defaults'] = true;
            value = formatting.format(fields, 'field', 'value', 'uppercase');
            value.should.eql('value');
        });

        it('should use the formatters from the field config', () => {
            fields.field.formatter = 'uppercase';
            value = formatting.format(fields, 'field', 'value');
            value.should.eql('VALUE');
        });

        it('should use the formatters from the field config for an array of values', () => {
            fields.field.formatter = 'uppercase';
            value = formatting.format(fields, 'field', ['value 1', 'value 2']);
            value.should.eql(['VALUE 1', 'VALUE 2']);
        });

        it('should ignore unknown formatters', () => {
            fields.field.formatter = 'unknown';
            value = formatting.format(fields, 'field', 'value');
            value.should.eql('value');
        });

        it('should format using a custom formatter function', () => {
            fields.field.formatter = value => value + ' custom formatter';
            value = formatting.format(fields, 'field', 'value');
            value.should.eql('value custom formatter');
        });

    });
});
