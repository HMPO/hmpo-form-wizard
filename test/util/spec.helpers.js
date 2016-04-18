var helpers = require('../../lib/util/helpers');

describe('helpers', function () {

    describe('getPreviousSteps', function () {
        var getPreviousSteps, steps;

        beforeEach(function () {
            getPreviousSteps = helpers.getPreviousSteps;
        });

        it('is a function', function () {
            getPreviousSteps.should.be.a('function');
        });

        it('returns an array', function () {
            getPreviousSteps().should.be.an('array');
        });

        describe('only using next property', function () {
            beforeEach(function () {
                steps = {
                    '/step1': {
                        next: '/step2'
                    },
                    '/step2': {
                        next: '/step3'
                    },
                    '/step3': {
                        next: '/step4'
                    },
                    '/step3a': {
                        next: '/step4'
                    },
                    '/step4': {}
                };
            });

            it('returns /step3a and /step3 when called with steps object and /step4', function () {
                getPreviousSteps('/step4', steps).should.be.eql(['/step3', '/step3a']);
            });

            it('should return an empty array if step isn\'t linked to', function () {
                getPreviousSteps('/step5', steps).should.be.an('array')
                  .and.have.property('length')
                  .and.equal(0);
            });
        });

        describe('using forks', function () {
            beforeEach(function () {
              steps = {
                  '/step1': {
                      forks: [{
                        target: '/step2'
                      }]
                  },
                  '/step2': {
                      forks: [{
                        target: '/step3'
                      }, {
                        target: '/step4'
                      }]
                  },
                  '/step3': {
                      forks: [{
                        target: '/step3a'
                      }]
                  },
                  '/step3a': {
                      forks: [{
                        target: '/step4'
                      }]
                  },
                  '/step4': {}
              };
            });

            it('should return a step that has route as a fork target', function () {
                getPreviousSteps('/step2', steps).should.be.eql(['/step1']);
            })

            it('should return all steps that have given step as fork target', function () {
                getPreviousSteps('/step4', steps).should.be.eql(['/step2', '/step3a']);
            });
        });

        describe('using next property and forks', function () {
            beforeEach(function () {
                steps = {
                    '/step1': {
                        next: '/step2',
                        forks: [{
                          target: '/step3'
                        }]
                    },
                    '/step2': {
                        next: '/step3',
                        forks: [{
                          target: '/step3a'
                        }, {
                          target: '/step4'
                        }]
                    },
                    '/step3': {},
                    '/step3a': {},
                    '/step4': {}
                }
            });

            it('should return all steps that link to route', function () {
                getPreviousSteps('/step3', steps).should.be.eql(['/step1', '/step2']);
            });
        });
    });

});
