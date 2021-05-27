module.exports = {
    name: {
        type: 'text',
        validate: 'required'
    },
    age: {
        type: 'number',
        validate: [
            'required',
            'numeric',
            { type: 'range', fn: value => value >= 0 && value < 120 },
        ]
    },
    color: {
        type: 'select',
        validate: 'required',
        items: [
            'red',
            'blue',
            'green',
            'purple',
            'pink'
        ]
    }
};
