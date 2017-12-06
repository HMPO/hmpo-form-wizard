'use strict';

const LocalModel = require('hmpo-model').Local;
const _ = require('underscore');

class SessionModel extends LocalModel {
    constructor(attrs, options) {
        options = options || {};

        if (!options.req || typeof options.req !== 'object') {
            throw new Error('session-model - req must be defined');
        }

        if (!options.req.session || typeof options.req.session !== 'object') {
            throw new Error('session-model - req.session must be defined');
        }

        if (!options.key || typeof options.key !== 'string') {
            throw new Error('session-model - key must be defined');
        }

        super({}, options);

        let initialValues = this.getSessionData();
        this.set(initialValues, { silent: true });

        this.on('change', this.updateSessionData);
        this.on('reset', this.resetSessionData);

        if (attrs) {
            this.set(attrs);
        }
    }

    getSessionData() {
        let session = this.options.req.session;
        let key = this.options.key;
        let data = session[key] = session[key] || {};
        return data;
    }

    updateSessionData(changes) {
        let session = this.options.req.session;
        _.extend(session[this.options.key], changes);
    }

    resetSessionData() {
        let session = this.options.req.session;
        session[this.options.key] = {};
    }

    save(cb) {
        this.options.req.session.save(cb);
    }

    reload(cb) {
        this.options.req.session.reload(err => {
            if (err) return cb(err);
            this._reload();
            cb();
        });
    }

    _reload() {
        this.attributes = {};
        let data = this.getSessionData();
        this.set(data, { silent: true });
    }

    destroy() {
        this.removeAllListeners();
        this.options.req = null;
        this.set = this.unset = this.reset = () => {
            throw new Error('Session Model has been destroyed');
        };
    }
}

module.exports = SessionModel;
