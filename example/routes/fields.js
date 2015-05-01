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
    gender: {
        validate: [
            'required'
        ],
        options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
        ]
    }
}