module.exports = {
    age: {
        type: 'number',
        journeyKey: 'myage',
        validate: [
            'required',
            'numeric'
        ]
    }
};
