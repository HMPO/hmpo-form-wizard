module.exports = {
    name: {
        validate: 'required'
    },
    age: {
        validate: [
            'required',
            'numeric',
            { type: 'range', fn: value => value >= 0 && value < 120 },
        ]
    },
    color: {
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
