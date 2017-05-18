'use strict';

const Controller = require('hmpo-form-wizard').Controller;

class Question extends Controller {
    locals(req, res) {
        let locals = super.locals(req, res);
        locals['field-name'] = Object.keys(req.form.options.fields)[0];
        return locals;
    }
}

module.exports = Question;
