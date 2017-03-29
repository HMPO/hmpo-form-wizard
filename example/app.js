'use strict';

/* eslint no-console: 0 */

const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const i18n = require('i18n-future');

let app = express();

app.use(cookieParser());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// add routing for static assets if running as a standalone server
app.use('/public', express.static(path.resolve(__dirname, './assets')));
app.use((req, res, next) => {
    res.locals.assetPath = '/public';
    next();
});

app.use(i18n.middleware({ baseDir: __dirname }));

require('hmpo-govuk-template').setup(app);
app.set('view engine', 'html');
app.engine('html', require('hogan-express-strict'));
app.set('views', path.resolve(__dirname, './views'));
app.use(require('express-partial-templates')(app));

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());

app.use((req, res, next) => {
    res.locals.baseUrl = req.baseUrl;
    next();
});

app.use(require('./routes'));

app.post('/api', (req, res) => {
    res.json(req.body);
});

app.use((err, req, res, next) => {
    console.log(err);
    if (err.redirect) {
        return res.redirect(err.redirect);
    }
    res.status(500).render('pages/error', { err: err });
});

app.listen(require('./config').PORT);
console.log('App listening on port', require('./config').PORT);
