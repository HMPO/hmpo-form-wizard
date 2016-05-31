module.exports = {
    '/': {
        controller: require('../controllers/start'),
        template: 'index',
        next: '/name'
    },
    '/name': {
        fields: ['name'],
        next: '/age'
    },
    '/age': {
        fields: ['age'],
        next: '/direction'
    },
    '/direction': {
        fields: ['direction'],
        next: '/left',
        forks: [{
            target: '/right',
            condition: {
                field: 'direction',
                value: 'right'
            }
        }]
    },
    '/right': {
        fields: ['right-only'],
        next: '/submit'
    },
    '/left': {
        fields: ['left-only'],
        next: '/submit'
    },
    '/submit': {
        controller: require('../controllers/submit'),
        next: '/done'
    },
    '/done': {
        backLink: null
    }
};
