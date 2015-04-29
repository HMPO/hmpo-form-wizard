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
        ],
        formatter: [
            'numeric'
        ]
    }
}