'use strict';

const { Controller } = require('hmpo-form-wizard');

class Question extends Controller {
    locals(req, res) {
        const locals = super.locals(req, res);
        locals.fieldName = Object.keys(req.form.options.fields)[0];
        return locals;
    }
}

module.exports = Question;
