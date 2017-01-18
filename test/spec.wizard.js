'use strict';

const stubController = require('./helpers/controller');
const express = require('express');
const proxyquire = require('proxyquire');

describe('Form Wizard', () => {

    let steps, fields, options, routerStub, ControllerClass, wizard;

    beforeEach(() => {
        routerStub = {
            all: sinon.stub()
        };
        sinon.stub(express, 'Router').returns(routerStub);

        ControllerClass = stubController();

        wizard = proxyquire('../lib/wizard', {
            './controller': ControllerClass
        });

        steps = {
            '/first': {
                template: 'template',
                fields: [ 'f1', 'f2', 'f5' ],
                anOption: 'override'
            }
        };

        fields = {
            f1: { field: 1 },
            f2: { field: 2 },
            f3: { field: 3 },
            f4: { field: 4 }
        };

        options = {
            name: 'test',
            templatePath: 'template/path',
            anOption: 'original'
        };
    });

    afterEach(() => {
        express.Router.restore();
    });


    it('should be a function', () => {
        wizard.should.be.a.function;
    });

    it('should return an express router', () => {
        let app = wizard({}, {}, { name: 'test' });
        app.should.equal(routerStub);
    });

    it('should create a controller with merged wizard and controller options', () => {
        wizard(steps, fields, options);

        ControllerClass.constructor.should.have.been.calledOnce;
        let opts = ControllerClass.constructor.args[0][0];
        opts.name.should.equal('test');
        opts.route.should.equal('/first');
        opts.params.should.equal('');
        opts.templatePath.should.equal('template/path');
        opts.template.should.equal('template');
        opts.anOption.should.equal('override');
        // steps should contain the processed step options for this step
        opts.steps['/first'].should.equal(opts);
    });

    it('should replace field list with field objects', () =>{
        wizard(steps, fields, options);

        let opts = ControllerClass.constructor.args[0][0];
        opts.fields.should.deep.equal({
            f1: { field: 1 },
            f2: { field: 2 },
            f5: {}
        });
    });

    it('should leave field objects if specified in options', () => {
        steps['/first'].fields = {
            f5: { field: 5 },
        };
        wizard(steps, fields, options);

        let opts = ControllerClass.constructor.args[0][0];
        opts.fields.should.deep.equal({
            f5: { field: 5 }
        });
    });

    // TODO: order of object is not defined
    it('should set the firstStep option to the name of the first step', () =>{
        steps['/second'] = {};
        steps['/third'] = {};

        wizard(steps, fields, options);

        let opts = ControllerClass.constructor.args[2][0];
        opts.firstStep.should.equal('/first');
    });

    it('should use a auto-generated name if none is supplied', () => {
        delete options.name;
        wizard(steps, fields, options);

        let opts = ControllerClass.constructor.args[0][0];
        opts.name.should.equal('0');

        ControllerClass.constructor.reset();
        delete options.name;
        wizard(steps, fields, options);

        opts = ControllerClass.constructor.args[0][0];
        opts.name.should.equal('1');
    });

    it('should use an auto-generated name if no options are supplied', () => {
        wizard(steps, fields);

        let opts = ControllerClass.constructor.args[0][0];
        opts.name.should.equal('0');
    });

    it('should call the controller\'s requestHandler', () => {
        ControllerClass.prototype.requestHandler.returns('Request Handler');
        wizard(steps, fields, options);
        ControllerClass.prototype.requestHandler.should.have.been.calledOnce;
        routerStub.all.should.have.been.calledOnce;
        routerStub.all.should.have.been.calledWithExactly('/first', 'Request Handler');
    });
});
