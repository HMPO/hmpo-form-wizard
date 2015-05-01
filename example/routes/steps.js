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
        next: '/gender'
    },
    '/gender': {
        fields: ['gender'],
        next: '/submit'
    },
    '/submit': {
        controller: require('../controllers/submit'),
        next: '/done'
    },
    '/done': {
        backLink: null
    }
}