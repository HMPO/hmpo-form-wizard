'use strict';

const path = require('path');
const reHTTP = /^https?:\/\//i;

module.exports = Controller => class extends Controller {

    resolvePath(base, url, forceRelative) {
        if (typeof url !== 'string') {
            return url;
        }
        if (reHTTP.test(url)) {
            return url;
        }
        if (forceRelative) {
            url = url.replace(/^\/+/, '');
        }
        return path.posix.resolve('/', base, url);
    }

};
