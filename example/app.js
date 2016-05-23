/* eslint no-console: 0 */

var express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    path = require('path'),
    i18n = require('i18n-future');

var app = express();

app.use(cookieParser());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// add routing for static assets if running as a standalone server
app.use('/public', express.static(path.resolve(__dirname, './assets')));
app.use(function (req, res, next) {
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

app.use(function (req, res, next) {
    res.locals.baseUrl = req.baseUrl;
    next();
});

app.use(require('./routes'));

app.post('/api', function (req, res) {
    res.json(req.body);
});

app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).render('pages/error', { err: err });
});

app.listen(require('./config').PORT);
console.log('App listening on port', require('./config').PORT);
