
module.exports = {
    direction: {
        type: 'radios',
        items: [
            'left',
            'right'
        ]
    },
    'left-only': {
        type: 'text',
        validate: 'required'
    },
    'right-only': {
        type: 'text',
        validate: 'required'
    }
};
