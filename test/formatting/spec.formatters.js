'use strict';

const formatters = require('../../lib/formatting').formatters;

function testStringFormatter(name, values) {
    describe(name, function () {
        let fn = formatters[name];
        it('passes through non-string', () => {
            fn(0).should.equal(0);
            fn(false).should.equal(false);
            expect(fn(null)).to.equal(null);
            expect(fn(undefined)).to.be.undefined;
        });

        Object.keys(values).forEach(input => {
            let output = values[input];
            it('formats "' + input + '"" to "' + output + '"', () => {
                fn(input).should.equal(output);
            });
        });
    });
}

describe('Formatters', () => {

    describe('boolean', () => {
        it('formats inputs correctly', () => {
            formatters.boolean(true).should.equal(true);
            formatters.boolean('true').should.equal(true);
            formatters.boolean(false).should.equal(false);
            formatters.boolean('false').should.equal(false);
            expect(formatters.boolean('other')).to.be.undefined;
            expect(formatters.boolean(null)).to.be.undefined;
            expect(formatters.boolean(undefined)).to.be.undefined;
            expect(formatters.boolean(1234)).to.be.undefined;
        });
    });

    testStringFormatter('trim', {
        'nospace': 'nospace',
        '  lspace': 'lspace',
        'rspace  ': 'rspace',
        ' mid space ': 'mid space'
    });

    testStringFormatter('uppercase', {
        'lowercase': 'LOWERCASE',
        'UPPERCASE': 'UPPERCASE',
        'MixedCase': 'MIXEDCASE'
    });

    testStringFormatter('lowercase', {
        'lowercase': 'lowercase',
        'UPPERCASE': 'uppercase',
        'MixedCase': 'mixedcase'
    });

    testStringFormatter('removespaces', {
        'nospace': 'nospace',
        '  lspace': 'lspace',
        'rspace  ': 'rspace',
        ' mid space ': 'midspace',
        ' multiple  \t spaces ': 'multiplespaces'
    });

    testStringFormatter('singlespaces', {
        'nospace': 'nospace',
        '  lspace': ' lspace',
        'rspace  ': 'rspace ',
        ' mid space ': ' mid space ',
        ' multiple  \t spaces ': ' multiple spaces '
    });

    testStringFormatter('hyphens', {
        'nohyphen': 'nohyphen',
        'hyphen–one': 'hyphen-one',
        'hyphen—two': 'hyphen-two',
        '-—–—-multiple-—–—-hyphens-—–—-': '-multiple-hyphens-'
    });

    testStringFormatter('apostrophes', {
        'no apos': 'no apos',
        'normal\'apos': 'normal\'apos',
        'curly’apos': 'curly\'apos',
        'back`tick': 'back\'tick',
        'forward‘apos': 'forward\'apos'
    });

    testStringFormatter('quotes', {
        'no quotes': 'no quotes',
        'double"quotes': 'double"quotes',
        'double“open': 'double"open',
        'double”close': 'double"close'
    });

    testStringFormatter('removeroundbrackets', {
        'nobrackets': 'nobrackets',
        '(brackets)': 'brackets'
    });

    testStringFormatter('removehyphens', {
        'nohyphen': 'nohyphen',
        'hyphen–one': 'hyphenone',
        'hyphen—two': 'hyphentwo',
        '-—–—-multiple-—–—-hyphens-—–—-': 'multiplehyphens'
    });

    testStringFormatter('removeslashes', {
        'noslashes': 'noslashes',
        '/forward/slashes': 'forwardslashes',
        '\\back\\slashes': 'backslashes'
    });

    testStringFormatter('ukphoneprefix', {
        '07987654321': '07987654321',
        '+447987654321': '07987654321',
        '+4407987654321': '07987654321',
        '+44(0)7987654321': '07987654321',
        '+44(07987654321': '07987654321',
        '+440)7987654321': '07987654321',
        '+44()7987654321': '07987654321'
    });

    describe('base64decode', () => {
        it('decodes base64 correctly', () => {
            formatters.base64decode('YWJjMTIz').should.equal('abc123');
        });
    });


});
