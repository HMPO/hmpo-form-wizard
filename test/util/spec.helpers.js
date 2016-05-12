var helpers = require('../../lib/util/helpers');

describe('helpers', function () {

    describe('getRouteSteps', function () {
        var getRouteSteps, steps;

        beforeEach(function () {
            getRouteSteps = helpers.getRouteSteps;
            steps = {
                '/step1': {
                    next: '/step2'
                },
                '/step2': {
                    next: '/step3'
                },
                '/step2a': {
                    next: '/step3'
                },
                '/step3': {
                    next: '/step4',
                    forks: [
                        { target: '/step5' }
                    ]
                },
                '/step4': {
                    next: '/step5',
                    forks: [
                        { target: '/step6' }
                    ]
                },
                '/step5': {
                    forks: [
                        { target: '/step6' }
                    ]
                },
                '/step6': {},
                '/orphan': {}
            };
        });

        it('is a function', function () {
            getRouteSteps.should.be.a('function');
        });

        it('returns an array', function () {
            getRouteSteps().should.be.an('array');
        });

        it('returns an empty array when there are no matching previous steps', function () {
            getRouteSteps('/orphan', steps).should.eql([]);
        });

        it('returns an array of all routes from `next` and `forks` properties', function () {
            // next
            getRouteSteps('/step3', steps).should.eql(['/step2', '/step2a']);
            // next and forks
            getRouteSteps('/step5', steps).should.eql(['/step3', '/step4']);
            // forks
            getRouteSteps('/step6', steps).should.eql(['/step4', '/step5']);
        });

    });

});
