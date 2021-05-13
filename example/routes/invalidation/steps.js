module.exports = {
    '/': {
        entryPoint: true,
        resetJourney: true,
        next: 'question1'
    },
    '/question1': {
        fields: ['question1'],
        template: 'question',
        next: 'question2'
    },
    '/question2': {
        fields: ['question2'],
        template: 'question',
        next: 'question3'
    },
    '/question3': {
        fields: ['question3'],
        template: 'question',
        next: 'question4'
    },
    '/question4': {
        fields: ['question4'],
        template: 'question',
        next: 'question5'
    },
    '/question5': {
        fields: ['question5'],
        template: 'question',
        next: 'done'
    },
    '/done': {
        noPost: true
    }
};
