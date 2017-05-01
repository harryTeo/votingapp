var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session); // Note: this should be placed after acquiring the "express-session".

require('dotenv').config();

var index = require('./routes/index');

var app = express();

mongoose.connect(process.env.MONGOLAB_URI);
mongoose.Promise = global.Promise;

require("./config/passport"); // Note: this should be placed after "mongoose.connect". We don't assign it to a var since we simply want to load the file and make it accessible to our app

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// Register handlebars(hbs) partials
hbs.registerPartials(__dirname + '/views/partials');
// Register handlebars(hbs) helpers
hbs.registerHelper('if_eq', function(a, b, opts) { // Helper to check for equality (comparing 2 quantities)
  if(a == b) return opts.fn(this);
  else return opts.inverse(this);
});
hbs.registerHelper("math", function(lvalue, operator, rvalue, options) { // Helper for simple mathematical operations
  if (arguments.length < 4) {
    // Operator omitted, assuming "+"
    options = rvalue;
    rvalue = operator;
    operator = "+";
  }
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);
  return {
    "+": lvalue + rvalue,
    "-": lvalue - rvalue,
    "*": lvalue * rvalue,
    "/": lvalue / rvalue,
    "%": lvalue % rvalue
  }[operator];
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection}),
  cookie: {maxAge: 180*60*1000} // Here, we basically declare how long our Sessions should live (on the server) before expiring (in this case 180 minutes)  
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.locals.isLoggedIn = req.isAuthenticated(); // So I am basically setting a (boolean) global variable here called "isLoggedIn" -> can be accessed from all views
  res.locals.userId = req.isAuthenticated() ? req.user._id : "";
  res.locals.session = req.session; // I also make the "session" variable object available to all views
  // res.locals.rootURL = req.protocol + '://' + req.get('host'); // In localhost -> http://localhost:8000
  next();
});

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Page Not Found!');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  var errorStatus = err.status || 500;
  var errorMessage = errorStatus == 500 ? "Internal Server Error - Please try again later" : "Page Not Found!";

  // render the error page
  res.status(errorStatus).render('error', { errorStatus: errorStatus, errorMessage: errorMessage });
});

module.exports = app;