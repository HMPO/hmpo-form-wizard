module.exports = {
    name: {
        validate: [
            'required'
        ]
    },
    age: {
        validate: [
            'required',
            'numeric'
        ]
    },
    direction: {
        validate: [
            'required'
        ],
        options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' }
        ]
    },
    'left-only': {
        validate: [
            'required'
        ]
    },
    'right-only': {
        validate: [
            'required'
        ]
    }
};
