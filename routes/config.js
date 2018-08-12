var express = require('express');
var router = express.Router();
var request = require('request');
var bcrypt = require('bcrypt');
var EmailTemplate = require('email-templates');
var async = require('async');
var nodemailer = require('nodemailer');
var pug = require('pug');
var mcache = require('memory-cache');


/* --------------------- ENCABEZADO DE ROUTER ------------------------------- */

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

var Datos = {}; // Super objeto que sera pasado como parametro a la vista. Aqui toda la configuración.


Datos.privilegio = 0; // Privilegio base del cliente

/* configuración del sistema */
var Xpl = require('../models/parametros/parametros').Parametros;

/* configuración del locales */
var Pais = require('../models/paises/paises').Paises;

/* gestión de usuario */
var User = require('../models/usuarios/usuarios').User;

/* gestión de enlaces */
var Enlace = require('../models/enlaces/enlaces').Enlace;
   
    Pais.find().where("estado").equals(true).sort({nombre:1}).exec(function(error, data)
    {
        
      if(error){
         console.log('Error recuperando paises');
      }else{
         Datos.paises = data;
      }

    });

/* --------------------- ENCABEZADO DE ROUTER ------------------------------- */

router.get('/', function(req, res, next) {
        res.send('parametros');
  }); // Cierre de método

/* POST API de logueo por ajax */
router.get('/index', function(req, res, next) {

    var nombreMetodo = "panel_index"; // Nombre del metodo (publico)
    var nvlMetodo = 5; // Nivel del metodo (publico)
    var nvlUser = 0; // Nivel del metodo (publico)

    if(req.session.privilegio)  { nvlUser = req.session.privilegio;}

    // Validando privilegios del usuario
    if(nvlUser<nvlMetodo)
    { 
        res.render('errors/error401', {data:Datos, usuario: req.session.usuario });

    }else
    {   

        Xpl.find().exec(function(error, data)
        {
            
          if(error){
             console.log('Error recuperando parametros');
             res.render('errors/error500', {data:Datos, usuario: req.session.usuario });
          }else{

                var valor = {};
                for(val in data)
                {

                        Datos[data[val].key] = data[val].valor;
                        if(data[val].key == "codejs")
                        {
                            bcrypt.hash(data[val].valor, 10).then(function(hashedPassword) {
                                Datos['hash'] = hashedPassword;
                            });
                        }
                }
                
                res.render('config/index', {data:Datos, usuario: req.session.usuario });

          }
           

        });

    } // Comprobación de privilegios del usuario

}); // Cierre de método


module.exports = router;
