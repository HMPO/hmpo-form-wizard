var createSteps = require('../../lib/middleware/steps');
var Model = require('../../lib/model');
var Controller = require('../../lib/controller');

describe('middleware/steps', function() {
  var req, res, next, controller, steps, stepData;

  beforeEach(function() {
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
    }
  });

  it('should set stepData on sessionModel if method is GET', function() {
    req.method = 'GET';
    var middleware = createSteps('/one', controller, steps, '/one');
    middleware(req, res, function() {
      expect(req.sessionModel.get('stepData')).to.be.an.instanceOf(Object);
    });
  });

  it('shouldn\'t set stepData if method is not GET', function() {
    req.method = 'POST';
    var middleware = createSteps('/one', controller, steps, '/one');
    middleware(req, res, function() {
      expect(req.sessionModel.get('stepData')).to.be.equal(undefined);
    });
  });

  describe('First Step', function(done) {
    beforeEach(function(done) {
      createSteps('/one', controller, steps, '/one')(req, res, function() {
        stepData = req.sessionModel.get('stepData');
        done();
      });
    });

    it('should have set the currentStepNumber to 1', function() {
      expect(stepData.currentStepNumber).to.be.equal(1);
    });

    it('should have set the totalSteps to 4', function() {
      expect(stepData.totalSteps).to.be.equal(5);
    });

    it('should have set the prevStep to \'/one\'', function() {
      expect(stepData.prevStep).to.be.equal('/one');
    });

    it('should have set the stepsJourney to [\'/one\']', function() {
      expect(stepData.stepsJourney).to.be.eql(['/one']);
    });
  });

  describe('Second Step', function() {
    beforeEach(function(done) {
      createSteps('/one', controller, steps, '/one')(req, res, function() {});
      createSteps('/two', controller, steps, '/one')(req, res, function() {
        stepData = req.sessionModel.get('stepData');
        done();
      });
    });

    it('should have set the currentStepNumber to 2', function() {
      expect(stepData.currentStepNumber).to.be.equal(2)
    });

    it('should have set the totalSteps to 4', function() {
      expect(stepData.totalSteps).to.be.equal(5);
    });

    it('should have set prevStep to /two', function() {
      expect(stepData.prevStep).to.be.equal('/two');
    });

    it('should have set the stepsJourney to [\'/one\', \'/two\']', function() {
      expect(stepData.stepsJourney).to.be.eql(['/one', '/two']);
    });
  });

  describe('Third Step', function() {
    beforeEach(function(done) {
      createSteps('/one', controller, steps, '/one')(req, res, function() {});
      createSteps('/two', controller, steps, '/one')(req, res, function() {});
      createSteps('/three', controller, steps, '/one')(req, res, function() {
        stepData = req.sessionModel.get('stepData');
        done();
      });
    });

    it('should have set the currentStepNumber to 3', function() {
      expect(stepData.currentStepNumber).to.be.equal(3)
    });

    it('should have set the totalSteps to 4', function() {
      expect(stepData.totalSteps).to.be.equal(5);
    });

    it('should have set prevStep to /three', function() {
      expect(stepData.prevStep).to.be.equal('/three');
    });

    it('should have set the stepsJourney to [\'/one\', \'/two\', \'/three\']', function() {
      expect(stepData.stepsJourney).to.be.eql(['/one', '/two', '/three']);
    });
  });

  describe('Forks', function() {
    describe('Adding to totalSteps', function() {
      beforeEach(function(done) {
        createSteps('/one', controller, steps, '/one')(req, res, function() {});
        createSteps('/forkOne', controller, steps, '/one')(req, res, function() {
          stepData = req.sessionModel.get('stepData');
          done();
        });
      });

      it('should have set the currentStepNumber to 2', function() {
        expect(stepData.currentStepNumber).to.be.equal(2);
      });

      it('should have set the totalSteps to 5', function() {
        expect(stepData.totalSteps).to.be.equal(6);
      });

      it('should have set prevStep to /forkOne', function() {
        expect(stepData.prevStep).to.be.equal('/forkOne');
      });

      it('should have set stepsJourney to [\'/one\', \'/forkOne\']', function() {
        expect(stepData.stepsJourney).to.be.eql(['/one', '/forkOne']);
      });
    });

    describe('Skipping steps', function() {
      beforeEach(function(done) {
        createSteps('/one', controller, steps, '/one')(req, res, function() {});
        createSteps('/forkTwo', controller, steps, '/one')(req, res, function() {
          stepData = req.sessionModel.get('stepData');
          done();
        });
      });

      it('should have set currentStepNumber to 2', function() {
        expect(stepData.currentStepNumber).to.be.equal(2);
      });

      it('should have set the totalSteps to 4', function() {
        expect(stepData.totalSteps).to.be.equal(4);
      });

      it('should have set prevStep to /forkTwo', function() {
        expect(stepData.prevStep).to.be.equal('/forkTwo');
      });

      it('should have set stepsJourney to [\'/one\', \'/forkTwo\']', function() {
        expect(stepData.stepsJourney).to.be.eql(['/one', '/forkTwo']);
      });
    });

    describe('Complex journey', function() {
      beforeEach(function(done) {
        createSteps('/one', controller, steps, '/one')(req, res, function() {});
        createSteps('/two', controller, steps, '/one')(req, res, function() {});
        createSteps('/three', controller, steps, '/one')(req, res, function() {});
        createSteps('/two', controller, steps, '/one')(req, res, function() {});
        createSteps('/one', controller, steps, '/one')(req, res, function() {});
        createSteps('/forkOne', controller, steps, '/one')(req, res, function() {});
        createSteps('/two', controller, steps, '/one')(req, res, function() {});
        createSteps('/forkTwo', controller, steps, '/one')(req, res, function() {
          stepData = req.sessionModel.get('stepData');
          done();
        });
      });

      it('should have set currentStepNumber to 4', function() {
        expect(stepData.currentStepNumber).to.be.equal(4);
      });

      it('should have set the totalSteps to 6', function() {
        expect(stepData.totalSteps).to.be.equal(6);
      });

      it('should have set prevStep to /forkTwo', function() {
        expect(stepData.prevStep).to.be.equal('/forkTwo');
      });

      it('should have set stepsJourney to [\'/one\', \'/forkOne\', \'/two\', \'/forkTwo\', \'/three\']', function() {
        expect(stepData.stepsJourney).to.be.eql(['/one', '/forkOne', '/two', '/forkTwo', '/three']);
      });
    });
  });
});
