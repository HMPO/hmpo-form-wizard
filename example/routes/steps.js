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
        next: '/submit'
    },
    '/submit': {
        controller: require('../controllers/submit'),
        next: '/done'
    },
    '/done': {}
}