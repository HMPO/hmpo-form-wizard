'use strict';

var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require('express-session');
var path = require('path');

app.use(cookieParser());

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));

// add routing for static assets if running as a standalone server
app.use('/public', express.static(path.resolve(__dirname, './assets')));
app.use(function setAssetPath(req, res, next) {
  res.locals.assetPath = '/public';
  next();
});

require('hmpo-govuk-template').setup(app);
app.set('view engine', 'html');
app.engine('html', require('hogan-express-strict'));
app.set('views', path.resolve(__dirname, './views'));
app.use(require('express-partial-templates')(app));

require('i18next').init({
  setJqueryExt: false,
  lng: 'en-GB'
});

app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('body-parser').json());

app.use(function setBaseUrl(req, res, next) {
  res.locals.baseUrl = req.baseUrl;
  next();
});

app.use(require('./routes'));

app.post('/api', function postToAPI(req, res) {
  res.json(req.body);
});

app.use(function handleError(err, req, res) {
  /* eslint-disable no-console */
  console.log(err);
  /* eslint-enable no-console */
  res.status(500).render('pages/error', {err: err});
});

app.listen(require('./config').PORT);
/* eslint-disable no-console */
console.log('App listening on port', require('./config').PORT);
/* eslint-enable no-console */
