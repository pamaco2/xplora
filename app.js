var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var compression = require('compression');
var robots = require('robots.txt');
var sm = require('sitemap');
var bcrypt = require('bcrypt');
var fileUpload = require('express-fileupload');

  /* configuración del sistema */
var stp = require('./config/setup');

var index = require('./routes/index');
var login = require('./routes/login');
var admin = require('./routes/administrador');
var usuarios = require('./routes/usuarios');
var catalogo = require('./routes/catalogo');
var productos = require('./routes/productos');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(compression());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({	secret:"palabra_secreta",	resave: false,	saveUninitialized: true }));

app.use(robots(__dirname + '/public/robots.txt'));

app.use(fileUpload());


app.use('/', index);
app.use('/', login);
app.use('/administrador', admin);
app.use('/usuarios', usuarios);
app.use('/catalogo', catalogo);
app.use('/productos', productos);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
    var Datos = stp;
    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword) {Datos['hash'] = hashedPassword;});

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if(err.status==404)
  {
 	 res.render('errors/error404', {data:Datos});
  	
  }
  if(err.status==500)
  {
 	 res.render('errors/error500', {data:Datos});
  }

});



module.exports = app;
