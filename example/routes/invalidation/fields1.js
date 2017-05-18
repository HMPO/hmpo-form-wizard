module.exports = {
    question1: {
        journeyKey: 'q1',
        validate: 'required'
    },
    question2: {
        validate: 'required',
        invalidates: [ 'question3', 'question4' ]
    },
    question3: {
        validate: 'required'
    },
    question4: {
        journeyKey: 'q4',
        validate: 'required'
    },
    question5: {
        validate: 'required'
    }
};
