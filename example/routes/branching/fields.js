module.exports = {
    direction: {
        options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' }
        ]
    },
    'left-only': {
        validate: 'required'
    },
    'right-only': {
        validate: 'required'
    }
};
