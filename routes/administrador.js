var express = require('express');
var router = express.Router();
var request = require('request');
var bcrypt = require('bcrypt');
var EmailTemplate = require('email-templates');
var async = require('async');
var nodemailer = require('nodemailer');
var pug = require('pug');
var mcache = require('memory-cache');
var Datos = require('../config/setup');




 var cache = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
      }
      next()
    }
  }
}



/* gestión de usuario */
var User = require('../models/usuarios/usuarios').User;

/* gestión de enlaces */
var Enlace = require('../models/enlaces/enlaces').Enlace;


/* GET home page. */
router.get('/', function(req, res, next) {


  if(req.session.privilegio >= 3){
       bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword){
         Datos['hash'] = hashedPassword;

         res.render('administrador/index', {data:Datos, sesion: req.session });
       });
	
	}else
	{
	   	var id = req.query.id || "";var url = req.baseUrl || "";
  		res.render('errors/error401', {data:Datos, usuario: req.session.usuario, id:id, target: url  });
	}

});

module.exports = router;
