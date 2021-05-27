module.exports = {
    '/': {
        entryPoint: true,
        resetJourney: true,
        next: 'question1'
    },
    '/question1': {
        editable: true,
        fields: ['question1'],
        template: 'question',
        next: 'question2'
    },
    '/question2': {
        editable: true,
        fields: ['question2'],
        template: 'question',
        next: 'question3'
    },
    '/question3': {
        editable: true,
        fields: ['question3'],
        template: 'question',
        next: 'question4'
    },
    '/question4': {
        editable: true,
        fields: ['question4'],
        template: 'question',
        next: 'question5'
    },
    '/question5': {
        editable: true,
        fields: ['question5'],
        template: 'question',
        next: 'done'
    },
    '/done': {
        noPost: true
    }
};
