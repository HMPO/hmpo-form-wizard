module.exports = {
    '/': {
        entryPoint: true,
        resetJourney: true,
        next: 'your-age'
    },
    '/your-age': {
        fields: ['age'],
        next: 'show-age-category'
    },
    '/done': {
        noPost: true
    }
};
