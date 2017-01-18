'use strict';

/* eslint no-console: 0 */

const Model = require('hmpo-model');

class Submit extends Model {
    url() {
        return require('../config').API_URL;
    }

    save(callback) {
        console.log('Saving model data to ' + this.url() + ':');
        console.log(this.toJSON());
        super.save(callback);
    }
}

module.exports = Submit;
