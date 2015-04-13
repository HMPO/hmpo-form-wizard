var chai = require('chai'),
    reqres = require('reqres');

global.should = chai.should();
global.expect = chai.expect;
global.sinon = require('sinon');

global.StubController = require('./helpers/controller');
global.request = reqres.req;
global.response = reqres.res;

chai.use(require('sinon-chai'));
