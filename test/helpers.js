var chai = require('chai');

global.should = chai.should();
global.expect = chai.expect;
global.sinon = require('sinon');

global.StubController = require('./helpers/controller');
global.request = require('./helpers/request');
global.response = require('./helpers/response');

chai.use(require('sinon-chai'));
