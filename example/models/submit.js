'use strict';

const Model = require('hmpo-model');
const config = require('../config');
const logger = require('hmpo-logger').get();
class Submit extends Model {
    url() {
        return config.api.url;
    }

    save(callback) {
        logger.info('Saving model data to :url', {
            url: this.url(),
            data: this.toJSON()
        });

        super.save(callback);
    }
}

module.exports = Submit;
