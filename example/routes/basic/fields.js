module.exports = {
    name: {
        validate: 'required'
    },
    age: {
        validate: [
            'required',
            'numeric'
        ]
    },
    color: {
        validate: 'required',
        options: [
            {value: ' ', label: 'Select a color'},
            'red',
            'blue',
            'green',
            'purple',
            'pink'
        ]
    }
};
