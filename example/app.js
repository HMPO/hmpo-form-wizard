'use strict';

const hmpoLogger = require('hmpo-logger');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const nunjucks = require('nunjucks');
const path = require('path');
const i18n = require('hmpo-i18n');
const bodyParser = require('body-parser');
const hmpoComponents = require('hmpo-components');
const config = require('./config');

const logger = hmpoLogger.config(config.logs).get();

const app = express();


// log access requests
app.use(hmpoLogger.middleware());


// add routing for static assets
app.use('/public', express.static(path.resolve(__dirname, 'public')));
app.use('/public/images', express.static(path.resolve(__dirname, 'node_modules', 'hmpo-components', 'assets', 'images')));
app.use('/public', express.static(path.resolve(__dirname, 'node_modules', 'govuk-frontend', 'dist', 'govuk', 'assets')));


// cookies and sessions (redis or elasticache should be used in a prod env)
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));


// templating engine (turn on caching and turn off watching in prod env)
app.set('view engine', 'html');
const nunjucksEnv = nunjucks.configure([
    path.resolve(__dirname, 'views'),
    path.resolve(__dirname, 'node_modules', 'hmpo-components', 'components'),
    path.resolve(__dirname, 'node_modules', 'govuk-frontend', 'dist')
], {
    express: app,
    dev: true,
    noCache: true,
    watch: true
});

// govuk-frontend v5 rebrand
nunjucksEnv.addGlobal('govukRebrand', true);


// localisation support (supports setting language with query parameters and storing in a cookie)
i18n.middleware(app, {
    query: 'lang',
    allowedLangs: [ 'en', 'cy'],
    cookie: { name: 'lang' },
    watch: true,
    baseDir: [
        path.resolve(__dirname),
        path.resolve(__dirname, 'node_modules', 'hmpo-components')
    ]
});


// initalise hmpo-components
hmpoComponents.setup(app, nunjucksEnv);


// add locals for templates
app.use((req, res, next) => {
    res.locals.assetPath = '/public';
    res.locals.baseUrl = req.baseUrl;
    next();
});


// body parser
app.use(bodyParser.urlencoded({ extended: true }));


// index page
app.get('/', (req, res) => res.render('pages/index'));


// wizard routes
app.use('/basic', require('./routes/basic'));
app.use('/branching', require('./routes/branching'));
app.use('/multiwizard', require('./routes/multiwizard'));
app.use('/invalidation', require('./routes/invalidation'));


// stub api for receiving form submissiion
app.post('/api', bodyParser.json(), (req, res) => {
    logger.info('API submitted', { req, api: req.body });
    res.json(req.body);
});


// file not found handler
app.use((req, res, next) => {
    res.status(404).render('pages/file-not-found');
});


// error handler
app.use((err, req, res, next) => {
    logger.error('Request error', { req, err });

    // handle session expired
    if (err.code === 'SESSION_TIMEOUT') {
        err.template = 'pages/session-expired';
    }

    // handle errors with automatic redirects
    if (err.redirect) {
        return res.redirect(err.redirect);
    }

    // show error page
    err.status = err.status || 500;
    err.template = err.template || 'pages/error';
    res.status(err.status).render(err.template, { err });
});


// listen for incomming requests
app.listen(config.port, () => {
    logger.info('App listening on http://localhost::port', { port: config.port });
});


