var checkProgress = require('../../lib/middleware/check-progress'),
    Model = require('../../lib/model'),
    Controller = require('../../lib/controller');

describe('middleware/check-progress', function () {

    var req, res, next, controller, steps;

    describe('checkProgress', function () {

      beforeEach(function () {
          req = request();
          req.sessionModel = new Model({}, { session: req.session, key: 'test' });
          res = response();
          next = sinon.stub();
          controller = new Controller({ template: 'index' });
          steps = {
              '/one': { next: '/two' },
              '/two': { next: '/three' },
              '/three': { next: '/four' },
              '/four': {}
          }
      });

      it('calls callback with no arguments if prerequisite steps are complete', function (done) {
          req.sessionModel.set('steps', [ '/one', '/two' ]);
          var middleware = checkProgress('/three', controller, steps, '/one');
          middleware(req, res, function (err) {
              expect(err).to.be.undefined;
              done();
          });
      });

      it('calls callback with MISSING_PREREQ error code if accessing step that has not had prerequisite steps complete', function (done) {
          req.sessionModel.set('steps', []);
          var middleware = checkProgress('/three', controller, steps, '/one');
          middleware(req, res, function (err) {
              err.code.should.equal('MISSING_PREREQ');
              done();
          });
      });

    });

    describe('Step Meta', function () {
        beforeEach(function () {
            req = request();
            req.sessionModel = new Model({}, { session: req.session, key: 'test' });
            res = response();
            next = sinon.stub();
            controller = new Controller({ template: 'index' });
            steps = {
                '/one': { next: '/two' },
                '/two': { next: '/three' },
                '/three': { next: '/four' },
                '/four': { next: '/five' },
                '/five': {},
                '/forkOne': { next: '/two' },
                '/forkTwo': { next: '/four' },
            };
        });

        it('should set stepData on sessionModel if method is GET', function () {
            req.method = 'GET';
            var middleware = checkProgress('/one', controller, steps, '/one');
            middleware(req, res, function () {
                expect(req.sessionModel.get('stepData')).to.be.an.instanceOf(Object);
            });
        });

        it('shouldn\'t set stepData if method is not GET', function () {
            req.method = 'POST';
            var middleware = checkProgress('/one', controller, steps, '/one');
            middleware(req, res, function () {
                expect(req.sessionModel.get('stepData')).to.be.equal(undefined);
            });
        });

        describe('First Step', function (done) {
            beforeEach(function (done) {
                checkProgress('/one', controller, steps, '/one')(req, res, function () {
                    stepData = req.sessionModel.get('stepData');
                    done();
                });
            });

            it('should have set the currentStepNumber to 1', function () {
                expect(res.locals.stepNumber).to.be.equal(1);
            });

            it('should have set the totalSteps to 4', function () {
                expect(res.locals.totalSteps).to.be.equal(5);
            });

            it('should have set the prevStep to \'/one\'', function () {
                expect(stepData.prevStep).to.be.equal('/one');
            });

            it('should have set the stepsJourney to [\'/one\']', function () {
                expect(stepData.stepsJourney).to.be.eql(['/one']);
            });
        });

        describe('Second Step', function () {
            beforeEach(function (done) {
                checkProgress('/one', controller, steps, '/one')(req, res, function () {});
                checkProgress('/two', controller, steps, '/one')(req, res, function () {
                    stepData = req.sessionModel.get('stepData');
                    done();
                });
            });

            it('should have set the currentStepNumber to 2', function () {
                expect(res.locals.stepNumber).to.be.equal(2)
            });

            it('should have set the totalSteps to 4', function () {
                expect(res.locals.totalSteps).to.be.equal(5);
            });

            it('should have set prevStep to /two', function () {
                expect(stepData.prevStep).to.be.equal('/two');
            });

            it('should have set the stepsJourney to [\'/one\', \'/two\']', function () {
                expect(stepData.stepsJourney).to.be.eql(['/one', '/two']);
            });
        });

        describe('Third Step', function () {
            beforeEach(function (done) {
                checkProgress('/one', controller, steps, '/one')(req, res, function () {});
                checkProgress('/two', controller, steps, '/one')(req, res, function () {});
                checkProgress('/three', controller, steps, '/one')(req, res, function () {
                    stepData = req.sessionModel.get('stepData');
                    done();
                });
            });

            it('should have set the currentStepNumber to 3', function () {
                expect(res.locals.stepNumber).to.be.equal(3)
            });

            it('should have set the totalSteps to 4', function () {
                expect(res.locals.totalSteps).to.be.equal(5);
            });

            it('should have set prevStep to /three', function () {
                expect(stepData.prevStep).to.be.equal('/three');
            });

            it('should have set the stepsJourney to [\'/one\', \'/two\', \'/three\']', function () {
                expect(stepData.stepsJourney).to.be.eql(['/one', '/two', '/three']);
            });
        });

        describe('Forks', function () {
            describe('Adding to totalSteps', function () {
                beforeEach(function (done) {
                    checkProgress('/one', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/forkOne', controller, steps, '/one')(req, res, function () {
                        stepData = req.sessionModel.get('stepData');
                        done();
                    });
                });

                it('should have set the currentStepNumber to 2', function () {
                    expect(res.locals.stepNumber).to.be.equal(2);
                });

                it('should have set the totalSteps to 5', function () {
                    expect(res.locals.totalSteps).to.be.equal(6);
                });

                it('should have set prevStep to /forkOne', function () {
                    expect(stepData.prevStep).to.be.equal('/forkOne');
                });

                it('should have set stepsJourney to [\'/one\', \'/forkOne\']', function () {
                    expect(stepData.stepsJourney).to.be.eql(['/one', '/forkOne']);
                });
            });

            describe('Skipping steps', function () {
                beforeEach(function (done) {
                    checkProgress('/one', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/forkTwo', controller, steps, '/one')(req, res, function () {
                        stepData = req.sessionModel.get('stepData');
                        done();
                    });
                });

                it('should have set currentStepNumber to 2', function () {
                    expect(res.locals.stepNumber).to.be.equal(2);
                });

                it('should have set the totalSteps to 4', function () {
                    expect(res.locals.totalSteps).to.be.equal(4);
                });

                it('should have set prevStep to /forkTwo', function () {
                    expect(stepData.prevStep).to.be.equal('/forkTwo');
                });

                it('should have set stepsJourney to [\'/one\', \'/forkTwo\']', function () {
                    expect(stepData.stepsJourney).to.be.eql(['/one', '/forkTwo']);
                });
            });

            describe('Complex journey', function () {
                beforeEach(function (done) {
                    checkProgress('/one', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/two', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/three', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/two', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/one', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/forkOne', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/two', controller, steps, '/one')(req, res, function () {});
                    checkProgress('/forkTwo', controller, steps, '/one')(req, res, function () {
                        stepData = req.sessionModel.get('stepData');
                        done();
                    });
                });

                it('should have set currentStepNumber to 4', function () {
                    expect(res.locals.stepNumber).to.be.equal(4);
                });

                it('should have set the totalSteps to 6', function () {
                    expect(res.locals.totalSteps).to.be.equal(6);
                });

                it('should have set prevStep to /forkTwo', function () {
                    expect(stepData.prevStep).to.be.equal('/forkTwo');
                });

                it('should have set stepsJourney to [\'/one\', \'/forkOne\', \'/two\', \'/forkTwo\', \'/three\']', function () {
                    expect(stepData.stepsJourney).to.be.eql(['/one', '/forkOne', '/two', '/forkTwo', '/three']);
                });
            });
        });
    });

});
