module.exports = {
    '/show-age-category': {
        skip: true,
        next: [
            {field: 'age', op: '<=', value: 2, next: 'is-baby'},
            {field: 'age', op: '<=', value: 12, next: 'is-child'},
            {field: 'age', op: '<', value: 20, next: 'is-teenager'},
            'is-adult'
        ]
    },
    '/is-baby': {
        next: 'done'
    },
    '/is-child': {
        next: 'done'
    },
    '/is-teenager': {
        next: 'done'
    },
    '/is-adult': {
        next: 'done'
    }
};
