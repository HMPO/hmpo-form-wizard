var checkProgress = require('../../lib/middleware/check-progress'),
    Model = require('../../lib/model'),
    Controller = require('../../lib/controller'),
    helpers = require('../../lib/util/helpers');

describe('middleware/check-session', function () {

    var req, res, controller, steps;

    beforeEach(function () {
        req = request();
        req.sessionModel = new Model({}, { session: req.session, key: 'test' });
        res = response();
        controller = new Controller({ template: 'index' });
        steps = {
            '/one': { next: '/two' },
            '/two': { next: '/three' },
            '/three': { next: '/four' },
            '/four': {}
        };
        sinon.stub(helpers, 'getRouteSteps').returns(['/one', '/two']);
        sinon.stub(Controller.prototype, 'getForkTarget');
    });

    afterEach(function () {
        helpers.getRouteSteps.restore();
        Controller.prototype.getForkTarget.restore();
    });

    it('calls getRouteSteps helper with route and steps', function () {
        checkProgress('/two', controller, steps, '/three');
        helpers.getRouteSteps.should.have.been.calledWithExactly('/two', steps);
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
        helpers.getRouteSteps.returns(['/two']);
        var middleware = checkProgress('/three', controller, steps, '/one');
        middleware(req, res, function (err) {
            err.code.should.equal('MISSING_PREREQ');
            done();
        });
    });

    describe('step/field invalidating logic', function () {
        var sessionFields, sessionSteps;

        beforeEach(function () {
            steps = {
                '/': {
                    next: '/step1'
                },
                '/step1': {
                    next: '/step2',
                    fields: [
                        'step-1-field-1',
                        'step-1-field-2'
                    ],
                    forks: [{
                        target: '/fork1'
                    }, {
                        target: '/step4'
                    }]
                },
                '/step2': {
                    next: '/step3',
                    fields: [
                        'step-2-field-1',
                        'step-2-field-2'
                    ],
                    forks: [{
                        target: '/step4'
                    }]
                },
                '/step3': {
                    next: '/step4',
                    fields: [
                        'step-3-field-1',
                        'step-3-field-2'
                    ]
                },
                '/fork1': {
                    next: '/step2',
                    fields: [
                        'fork-field-1',
                        'fork-field-2'
                    ]
                },
                '/step4': {
                    fields: [
                        'step-4-field-1',
                        'step-4-field-2'
                    ]
                }
            };

            sessionFields = {
                'step-1-field-1': true,
                'step-1-field-2': true,
                'step-2-field-1': true,
                'step-2-field-2': true,
                'step-3-field-1': true,
                'step-3-field-2': true,
                'step-4-field-1': true,
                'step-4-field-2': true,
                'fork-field-1': true,
                'fork-field-2': true
            };

            sessionSteps = ['/step1', '/step2', '/step3', '/fork1', '/step4'];

            req.sessionModel.set(sessionFields);
            req.sessionModel.set({
                steps: sessionSteps
            });

            controller.options.next = steps['/step1'].next;
            controller.options.forks = steps['/step1'].forks;

            checkProgress('/step1', controller, steps, '/');
        });

        describe('when all steps are still reachable after forking', function () {
            beforeEach(function () {
                Controller.prototype.getForkTarget.returns('/fork1');
                controller.emit('complete', req, res);
            });

            it('no steps are removed', function () {
                req.sessionModel.get('steps').should.be.eql(sessionSteps);
            });

            it('doesn\'t invalidate any fields', function () {
                req.sessionModel.toJSON().should.contain.all.keys(
                    'step-1-field-1',
                    'step-1-field-2',
                    'step-2-field-1',
                    'step-2-field-2',
                    'step-3-field-1',
                    'step-3-field-2',
                    'step-4-field-1',
                    'step-4-field-2',
                    'fork-field-1',
                    'fork-field-2'
                );
            });
        });

        describe('when a step is skipped', function () {

            beforeEach(function () {
                req.method = 'POST';
                Controller.prototype.getForkTarget.returns('/step2');
                controller.emit('complete', req, res);
            });

            it('invalidates skipped step', function () {
                req.sessionModel.get('steps').should.not.contain('/fork1');
            });

            it('invalidates fields associated with skipped step', function () {
                expect(req.sessionModel.get('fork-field-1')).to.be.undefined;
                expect(req.sessionModel.get('fork-field-2')).to.be.undefined;
            });

            it('doens\'t invalidate the \'next\' step in the current journey', function () {
                req.sessionModel.get('steps').should.contain('/step2');
            });

            it('doesn\'t unset fields associated with the next step in the current journey', function () {
                req.sessionModel.get('step-2-field-1').should.be.true;
                req.sessionModel.get('step-2-field-2').should.be.true;
            });

        });

        describe('when the result of forking skips multiple steps', function () {

            beforeEach(function () {
                req.method = 'POST';
                Controller.prototype.getForkTarget.returns('/step4');
                controller.emit('complete', req, res);
            });

            it('invalidates skipped steps', function () {
                req.sessionModel.get('steps').should.not.contain.any('/step2', '/step3', '/fork1');
            });

            it('doesn\'t invalidate steps in current journey', function () {
                req.sessionModel.get('steps').should.contain.all('/step1', '/step4');
            });

            it('invalidates all fields associated with skipped steps', function () {
                req.sessionModel.toJSON().should.not.contain.any.keys(
                    'step-2-field-1',
                    'step-2-field-2',
                    'step-3-field-1',
                    'step-3-field-2',
                    'fork-field-1',
                    'fork-field-2'
                );
            });
        });

        describe('intertwined steps', function () {
            it('doesn\'t timeout when recursive route is possible', function () {
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
                            target: '/step1'
                        }]
                    },
                    '/step3': {}
                };
                checkProgress('/step1', controller, steps, '/');
                req.method = 'POST';
                Controller.prototype.getForkTarget.returns('/step2');
                expect(function () {
                    controller.emit('complete', req, res);
                }).to.not.throw();
            });
        });

    });

});
