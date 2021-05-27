module.exports = {
    question1: {
        type: 'text',
        journeyKey: 'q1',
        validate: 'required'
    },
    question2: {
        type: 'text',
        validate: 'required',
        invalidates: [ 'question3', 'question4' ]
    },
    question3: {
        type: 'text',
        validate: 'required'
    },
    question4: {
        type: 'text',
        journeyKey: 'q4',
        validate: 'required'
    },
    question5: {
        type: 'text',
        validate: 'required'
    }
};
