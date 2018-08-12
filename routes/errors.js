var express = require('express');
var router = express.Router();
var request = require('request');
var bcrypt = require('bcrypt');
var EmailTemplate = require('email-templates');
var async = require('async');
var nodemailer = require('nodemailer');
var pug = require('pug');




var Datos = {}; // Super objeto que sera pasado como parametro a la vista. Aqui toda la configuración.


Datos.privilegio = 0; // Privilegio base del cliente

/* configuración del sistema */
var Xpl = require('../models/parametros/parametros').Parametros;

/* gestión de usuario */
var User = require('../models/usuarios/usuarios').User;



    Xpl.find().exec(function(error, data)
    {
    	
      if(error){
         console.log('Error recuperando parametros');
      }else{

	    	var valor = {};
	    	for(val in data){
	    			Datos[data[val].key] = data[val].valor;
	    			if(data[val].key == "codejs")
	    			{
	 					bcrypt.hash(data[val].valor, 10).then(function(hashedPassword) {
	    					Datos['hash'] = hashedPassword;
	    				});
	    			}
	    	}
	    	
      }

    });



/* GET home page. */
router.get(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

router.get(function(err, req, res, next) {

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if(err.status==404)
  {
 	 res.render('errors/error404', err);
  	
  }
  if(err.status==500)
  {
 	 res.render('errors/error500', err);
  }


});


module.exports = router;
