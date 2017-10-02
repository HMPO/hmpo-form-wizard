'use strict';

const LocalModel = require('hmpo-model').Local;
const _ = require('underscore');

class SessionModel extends LocalModel {
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

        super({}, options);

        let initialValues = this.getSessionData();
        this.set(initialValues);

        this.on('change', this.updateSessionData);
        this.on('reset', this.resetSessionData);

        if (attrs) {
            this.set(attrs);
        }
    }

    getSessionData() {
        let session = this.options.session;
        let key = this.options.key;
        let data = session[key] = session[key] || {};
        return data;
    }

    updateSessionData(changes) {
        _.extend(this.options.session[this.options.key], changes);
    }

    resetSessionData() {
        this.options.session[this.options.key] = {};
    }

    destroy() {
        this.removeAllListeners();
        this.set = this.unset = this.reset = () => {
            throw new Error('Session Model has been destroyed');
        };
    }
}

module.exports = SessionModel;
