module.exports = {
    '/': {
        entryPoint: true,
        resetJourney: true,
        next: 'your-name'
    },
    '/your-name': {
        fields: ['name'],
        next: 'your-age'
    },
    '/your-age': {
        fields: ['age'],
        next: 'your-favorite-color'
    },
    '/your-favorite-color': {
        fields: ['color'],
        template: 'favorite-color',
        next: 'submit'
    },
    '/submit': {
        controller: require('../../controllers/submit'),
        next: 'done'
    },
    '/done': {
        backLink: null,
        noPost: true
    }
};
