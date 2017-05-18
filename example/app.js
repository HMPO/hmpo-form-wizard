'use strict';

/* eslint no-console: 0 */

const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const i18n = require('i18n-future');

let app = express();


// add routing for static assets if running as a standalone server
app.use('/public/stylesheets', express.static(path.resolve(__dirname, './assets/stylesheets')));
app.use('/public/images', express.static(path.resolve(__dirname, './assets/images')));


// cookiees and sessions
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


// localisation support
app.use(i18n.middleware({ baseDir: __dirname }));


// templating engine
app.set('view engine', 'html');
app.engine('html', require('hogan-express-strict'));


// templates and partials
app.set('views', path.resolve(__dirname, 'views'));
require('hmpo-govuk-template').setup(app);
app.use(require('hmpo-templates'));
app.use(require('express-partial-templates')(app));


// locals for templates
app.use((req, res, next) => {
    res.locals.assetPath = '/public';
    res.locals.baseUrl = req.baseUrl;
    next();
});


// body parser
app.use(require('body-parser').urlencoded({ extended: true }));

// index page
app.get('/', (req, res) => res.render('pages/index'));

// wizard routes
app.use('/basic', require('./routes/basic'));
app.use('/branching', require('./routes/branching'));
app.use('/multiwizard', require('./routes/multiwizard'));
app.use('/invalidation', require('./routes/invalidation'));


// stub api for receiving form submissiion
app.post('/api', (req, res) => {
    res.json(req.body);
});


// file not found handler
app.use((req, res, next) => {
    next({ message: 'File Not Found', status: 404 });
});


// error handler
app.use((err, req, res, next) => {
    console.log(err);
    if (err.redirect) {
        return res.redirect(err.redirect);
    }
    res.status(err.status || 500).render('pages/error', { err: err });
});


app.listen(require('./config').PORT);
console.log('App listening on port', require('./config').PORT);
