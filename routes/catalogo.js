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
var moment = require('moment');
var fs = require('fs');

/* gestión de usuario */
var User = require('../models/usuarios/usuarios').User;
var Privilegios = require('../models/privilegios/privilegios').Privilegios;

var Productos = require('../models/productos/productos').Productos;


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


/* GET users listing. */
router.get('/', function(req, res, next) {
	var nvlMetodo = 0; // Nivel del metodo (publico)
	var privUser = 0;
    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword)
    {
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
  		if(privUser < nvlMetodo){ res.render('errors/error401', {data:Datos, usuario: req.session, id:req.query.id || "", target: req.originalUrl || ""  });}else
  		{

  			var query = Productos.find({});
 			//query.where(estado,true);
			query.exec(function (err, docsAll) {
				if(err){console.log('Error recuperando items');}

	  			res.render('catalogo', {data:Datos, hash:hashedPassword, sesion: req.session, items: docsAll});

			}); 			
  			

  		}
	
    });

}); // --Cierre metodo



/* GET users listing. */
router.get('/item', function(req, res, next) {
	var nvlMetodo = 0; // Nivel del metodo (publico)
	var privUser = 0;

    aliasItem = req.query.al;

    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword)
    {
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
  		if(privUser < nvlMetodo){ res.render('errors/error401', {data:Datos, usuario: req.session.usuario, target: req.originalUrl || ""  });}else
  		{
 
  			var query = Productos.findOne({"alias":aliasItem}, function (err, doc) { if(err){console.log('Error recuperando item');}

				if(doc.length==0)
				{
				   	var id =  "";var url = req.originalUrl || "";
			  		res.render('errors/error404', {data:Datos, usuario: req.session.usuario, id:id, target: url  });
				}else{

					res.render('item', {hash:hashedPassword,data:Datos, item:doc, sesion: req.session});
						
				}

			});
		}
	});

});


/* POST API de logueo por ajax */
router.post('/jslistasolicitudes', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;
	var hash = "";

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var COOK = JSON.parse(req.cookies.listar_solicitudes);
			var PAG = COOK.pagina * COOK.limit;
			var PPAG = COOK.limit;
			console.log(COOK)
			

			var PAGS = 1;

 			var query = Cotizaciones.find({$or: [{nombre:new RegExp(COOK.texto, 'i') },{email:new RegExp(COOK.texto, 'i') }]});

  			query.sort('-creado');

		
			query.exec(function (err, docsAll) {
				
				if(err){console.log('Error recuperando solicitudes');}
 				var queryII = Cotizaciones.find({$or: [{nombre:new RegExp(COOK.texto, 'i') },{email:new RegExp(COOK.texto, 'i') }]});
 				var cantidadItems = docsAll.length;
 				if(cantidadItems>PPAG){
 					var factor = cantidadItems % PPAG;
 					PAGS = parseInt(cantidadItems / PPAG);
 					if(factor!=0)
 					{
 						PAGS++;
 					}

 				}


				queryII.limit(PPAG);
				queryII.skip(PAG);

  				queryII.sort('-creado');

				queryII.exec(function (errr, docsSelect) {
					if(errr){console.log('Error recuperando solicitudes');}



					var registros = [];
					for (i=0;i<docsSelect.length;i++) {
						registros[i] = {
							id:docsSelect[i]._id,
							nombre:docsSelect[i].nombre,
							email:docsSelect[i].email,
							nota:docsSelect[i].nota,
							estado:docsSelect[i].estado,
							creado:moment(docsSelect[i].creado).format('DD-MM-YY HH:mm:ss'),
							autor:docsSelect[i].autor,
							vehiculo:docsSelect[i].vehiculo
						}

					}

					res.json({estado:true, mensaje:'Petición completa', datos:registros, paginacion: PAGS, pagina: COOK.pagina});
     				res.end();

				});
			});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método


/* POST API de logueo por ajax */
router.post('/jseliminarsolicitud', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			 var idItem = req.body.id || '';

			   Cotizaciones.remove({_id: idItem}, function(error){
			      if(error){
			        res.send({estado:true,mensaje:"Error al intentar eliminar el registro."});
			      }else{ 
			        res.send({estado:true,mensaje:"Registro eliminado correctamente."});
			      }
			   });

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método


// crear un objeto de transporte reutilizable usando SMTP transport
var transporter = nodemailer.createTransport({
	host: Datos.mail_smtp_host, 
	port: Datos.mail_smtp_port ,secure: false, // true for 465, false for other ports
    auth: {user: Datos.mail_smtp_user, pass: Datos.mail_smtp_pass},
    tls: { rejectUnauthorized: false}/* do not fail on invalid certs*/	    
});

module.exports = router;
