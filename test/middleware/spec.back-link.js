var proxyquire = require('proxyquire'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

var getBackLinks = function (previousSteps) {
    return proxyquire('../../lib/middleware/back-links', {
        '../util/helpers': {
            getPreviousSteps: sinon.stub().returns(previousSteps)
        }
    });
};

describe('Back Links', function () {

    var controller, steps, req, res, next, backLinks;

    var StubController = function () {
        this.options = {};
    };
    util.inherits(StubController, EventEmitter);

    beforeEach(function () {

        steps = {
            '/step1': {
                next: '/step2'
            },
            '/step2': {
                next: '/step3',
                fields: {
                    photo: {
                        invalidates: ['name']
                    }
                }
            },
            '/step3': {
                next: '/step4',
                fields: {
                    name: {
                        invalidates: []
                    }
                }
            },
            '/step3a': {
                next: '/step4'
            },
            '/step4': {
                next: '/step5'
            },
            '/step5': {}
        };

        controller = new StubController();

        req = request({
            method: 'GET',
            session: {
                user: {
                    steps: [],
                    photo: 'aaa111',
                    name: 'John'
                }
            }
        });
        res = {
            locals: {},
            redirect: sinon.stub()
        };
        next = sinon.stub();

    });

    it('is only set on a GET request', function () {
        req.method = 'POST';
        req.sessionModel.set('steps', ['/step1']);
        backLinks = getBackLinks();
        backLinks('/', controller, steps)(req, res, next);
        expect(res.locals.backLink).to.be.undefined;
    });

    it('adds the previous step to res.locals.backLink', function () {
        req.sessionModel.set('steps', ['/step1']);
        backLinks = getBackLinks(['/step1']);
        backLinks('/step2', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('step1');
    });

    it('is not defined for first step of journey', function () {
        backLinks = getBackLinks();
        backLinks('/', controller, steps)(req, res, next);
        expect(res.locals.backLink).to.be.undefined;
    });

    it('adds the most recently visited previous step if there are multiple options', function () {
        req.sessionModel.set('steps', ['/step1', '/step3', '/step3a']);
        backLinks = getBackLinks(['/step3a', '/step3'])
        backLinks('/step4', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('step3a');

        req.sessionModel.set('steps', ['/step1', '/step3a', '/step3']);
        backLinks('/step4', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('step3');
    });

    it('uses configured backLink property if it exists', function () {
        controller.options.backLink = '/back';
        backLinks = getBackLinks();
        backLinks('/', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('/back');
    });

    it('sets backLink to falsy value if it is configured', function () {
        controller.options.backLink = null;
        backLinks = getBackLinks();
        backLinks('/', controller, steps)(req, res, next);
        expect(res.locals.backLink).to.be.null;
    });

    it('whitelists referrer header if no configured backwards route', function () {
        req.get.withArgs('referrer').returns('http://example.com/whitelist');
        req.sessionModel.set('steps', ['/step1', '/step2']);
        controller.options.backLinks = ['whitelist'];
        backLinks = getBackLinks();
        backLinks('/step3', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('whitelist');
    });

    it('supports links prefixed with `./`', function () {
        req.get.withArgs('referrer').returns('http://example.com/whitelist');
        req.sessionModel.set('steps', ['/step1', '/step2']);
        controller.options.backLinks = ['./whitelist'];
        backLink = getBackLinks();
        backLinks('/step3', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('whitelist');
    });

    it('strips baseUrl before checking whitelist', function () {
        req.get.withArgs('referrer').returns('http://example.com/base/whitelist');
        req.sessionModel.set('steps', ['/step1', '/step2']);
        req.baseUrl = '/base';
        controller.options.backLinks = ['whitelist'];
        backLinks = getBackLinks();
        backLinks('/step3', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('whitelist');
    });

    it('supports absolute paths in whitelist', function () {
        req.get.withArgs('referrer').returns('http://example.com/whitelist');
        req.sessionModel.set('steps', ['/step1', '/step2']);
        req.baseUrl = '/base';
        controller.options.backLinks = ['/whitelist'];
        backLinks = getBackLinks();
        backLinks('/step3', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('/whitelist');
    });

    it('permits whitelisting of steps in history', function () {
        req.get.withArgs('referrer').returns('http://example.com/base/step4');
        req.sessionModel.set('steps', ['/step1', '/step2', '/step3a', '/step4']);
        controller.options.backLinks = ['/step2'];
        backLinks = getBackLinks();
        backLinks('/step3a', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('step2');
    });

    it('returns most recent of whitelisted steps in history', function () {
        req.get.withArgs('referrer').returns('http://example.com/base/step4');
        req.sessionModel.set('steps', ['/step1', '/step2', '/step3a', '/step4']);
        controller.options.backLinks = ['/step2', '/step1'];
        backLinks = getBackLinks();
        backLinks('/step3a', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('step2');
    });

    it('returns undefined if referrer header is not on whitelist', function () {
        req.get.withArgs('referrer').returns('http://example.com/not-whitelisted');
        req.sessionModel.set('steps', ['/step1', '/step2']);
        controller.options.backLinks = ['whitelist'];
        backLinks = getBackLinks();
        backLinks('/', controller, steps)(req, res, next);
        expect(res.locals.backLink).to.be.undefined;
    });

    it('permits whitelisting of steps from a separate form instance', function () {
        req.get.withArgs('referrer').returns('http://example.com/referrer');
        req.sessionModel.set('steps', ['/step1', '/step2', '/step3', '/step4']);
        req.session['hmpo-wizard-test-form'] = { steps: ['/history1', '/history2']};
        controller.options.backLinks = ['./history1'];
        backLinks = getBackLinks();
        backLinks('/step3', controller, steps)(req, res, next);
        res.locals.backLink.should.equal('history1');
    });

    describe('isBackLink request object property', function () {

        it('is true when the last step matches the page path', function () {
            req.sessionModel.set('steps', ['/step1', '/step2']);
            controller.options.path ='/step2';
            backLinks = getBackLinks();
            backLinks('/step2', controller, steps)(req, res, next);
            req.isBackLink.should.be.ok;
        });

        it('is true when the last step matches the next path', function () {
            req.sessionModel.set('steps', ['/step1', '/step2']);
            controller.options.next = '/step2';
            backLinks = getBackLinks();
            backLinks('/step1', controller, steps)(req, res, next);
            req.isBackLink.should.be.ok;
        });

    });

});
