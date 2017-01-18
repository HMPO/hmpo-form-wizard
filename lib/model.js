'use strict';

const Model = require('hmpo-model');
const _ = require('underscore');

class SessionModel extends Model {
    constructor(attrs, options) {
        options = options || {};
        let session = options.session;
        let key = options.key;

        if (!session || typeof session !== 'object') {
            throw new Error('session-model - session must be defined');
        }

        if (!key || typeof key !== 'string') {
            throw new Error('session-model - key must be defined');
        }

        session[key] = session[key] || {};

        super(session[key], options);

        // write changes back to the session
        this.on('change', changes => _.extend(session[key], changes) );
        this.on('reset', () => session[key] = {});

        if (attrs) {
            this.set(attrs);
        }
    }

    destroy() {
        this.removeAllListeners();
        this.set = this.unset = this.reset = () => {
            throw new Error('Session Model has been destroyed');
        };
    }
}

module.exports = SessionModel;
