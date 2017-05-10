module.exports = {
    '/': {
        entryPoint: true,
        resetJourney: true,
        next: 'choose-direction'
    },
    '/choose-direction': {
        fields: ['direction'],
        next: [
            { field: 'direction', value: 'right', next: 'right-branch' },
            { field: 'direction', value: 'left', next: 'left-branch' },
            'neither-branch'
        ]
    },
    '/right-branch': {
        fields: ['right-only'],
        next: 'done'
    },
    '/left-branch': {
        fields: ['left-only'],
        next: 'done'
    },
    '/neither-branch': {
        next: 'done'
    },
    '/done': {
        noPost: true
    }
};
