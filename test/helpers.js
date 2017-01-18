const chai = require('chai');

global.should = chai.should();
global.expect = chai.expect;
global.sinon = require('sinon');

global.request = require('./helpers/request');
global.response = require('./helpers/response');

chai.use(require('sinon-chai'));
