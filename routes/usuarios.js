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

/* gestión de usuario */
var User = require('../models/usuarios/usuarios').User;
var Privilegios = require('../models/privilegios/privilegios').Privilegios;



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
		var nvlMetodo = 4; // Nivel del metodo (publico)

  if(req.session.privilegio >= nvlMetodo){
       bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword){
          Datos['hash'] = hashedPassword;
		    var privAll = Privilegios.find({});
				privAll.where('rango').lt(req.session.privilegio);
				privAll.exec(function (error, privs) {
					if(error){console.log('Error recuperando usuarios');}
	     			console.log(privs)
	     			res.render('usuarios/index', {data:Datos, sesion: req.session, privilegios: privs});
 				});
       });
	
	}else
	{
	   	var id = req.query.id || "";var url = req.baseUrl || "";
  		res.render('errors/error401', {data:Datos, usuario: req.session.usuario, id:id, target: url  });
	}

});



/* GET users listing. */
router.get('/item', function(req, res, next) {
	var nvlMetodo = 4; // Nivel del metodo (publico)

  idItem = req.query.id;

  if(req.session.privilegio >= nvlMetodo){
       bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword){
         Datos['hash'] = hashedPassword;
		    

 		var query = User.findOne({"_id":idItem}, function (err, docsAll) { if(err){console.log('Error recuperando item');}

			if(docsAll.length==0)
			{


			   	var id =  "";var url = req.originalUrl || "";
		  		res.render('errors/error404', {data:Datos, usuario: req.session.usuario, id:id, target: url  });

			}else{

 					var privilegio = Privilegios.findOne({"rango":docsAll.privilegio});
					privilegio.exec(function (error, priv) {
						var nombrePriv = priv.alias || priv.nombre;
						if(error){console.log('Error recuperando usuarios');}

						var privAll = Privilegios.find({});
							privAll.where('rango').lt(req.session.privilegio);

						privAll.exec(function (error, privs) {
							if(error){console.log('Error recuperando usuarios');}

						
     						res.render('usuarios/item', {data:Datos, item:docsAll, sesion: req.session,userPriv:nombrePriv, privilegios: privs});
						});
					});
					
			}

		});

       });
	
	}else
	{
	   	var id = "";var url = req.originalUrl || "";
  		res.render('errors/error401', {data:Datos, usuario: req.session.usuario, id:id, target: url  });
	}

});

/* POST API de logueo por ajax */
router.post('/jslistausuarios', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var COOK = JSON.parse(req.cookies.listar_usuarios);
			var PAG = COOK.pagina * COOK.limit;
			var PPAG = COOK.limit;
			

			var PAGS = 1;

 			var query = User.find({$or: [{nombre:new RegExp(COOK.texto, 'i') },{apellido:new RegExp(COOK.texto, 'i') },{usuario:new RegExp(COOK.texto, 'i') }]});


			query.where('privilegio').lt(Datos.privilegio);
			if(COOK.tags!=""){query.where('tags').in(COOK.tags);}
			
			//query.asc('nombre');

			query.exec(function (err, docsAll) {
				

				if(err){console.log('Error recuperando usuarios');}

 				//var queryII = User.find({apellido: new RegExp(COOK.texto, 'i')});
 				var queryII = User.find({$or: [{nombre:new RegExp(COOK.texto, 'i') },{apellido:new RegExp(COOK.texto, 'i') },{usuario:new RegExp(COOK.texto, 'i') }]});
 				var cantidadItems = docsAll.length;
 				if(cantidadItems>PPAG){
 					var factor = cantidadItems % PPAG;
 					PAGS = parseInt(cantidadItems / PPAG);
 					if(factor!=0)
 					{
 						PAGS++;
 					}

 				}

				queryII.where('privilegio').lt(Datos.privilegio);

				if(COOK.tags!=""){queryII.where('tags').in(COOK.tags);}

				//queryII.asc('apellido');
				queryII.limit(PPAG);
				queryII.skip(PAG);

  				queryII.sort('apellido');
  				//queryII.sort('nombre');

				queryII.exec(function (errr, docsSelect) {
					if(errr){console.log('Error recuperando usuarios');}
 					
 					var privilegios = Privilegios.find({});

					privilegios.exec(function (error, priv) {
					if(error){console.log('Error recuperando usuarios');}

 							res.json({estado:true, mensaje:'Petición completa', datos:docsSelect, paginacion: PAGS, pagina: COOK.pagina,privilegios:priv});
			     			res.end();
					});
				});
			});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método

/* POST API de logueo por ajax */
router.post('/jsguargarregirstro', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			 var idItem = req.body.id || '';

	  		var query = User.findOne({"_id":idItem},function(err, user){

	  			 if(err){console.log('Error recuperando item');}

	  			var usuario = user;
	  			if(req.body.datos.nombre!=""){usuario.nombre=req.body.datos.nombre;}
	  			if(req.body.datos.apellido!=""){usuario.apellido=req.body.datos.apellido;}
	  			if(req.body.datos.telefono!=""){usuario.telefono=req.body.datos.telefono;}


	  			usuario.save(function(error, documento){
					if(error){return res.send({estado:false,mensaje:"Error guardando datos."});}
					return res.send({estado:true,mensaje:"Registro actualizado correctamente."});
	  			});

	  		});


	       

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método

/* POST API de logueo por ajax */
router.post('/jsactualizarrango', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			 var idItem = req.body.id || '';

	  		var query = User.findOne({"_id":idItem},function(err, user){

	  			 if(err){console.log('Error recuperando item');}

	  			var usuario = user;
	  				
	  				usuario.privilegio= parseInt(req.body.datos.privilegio) || 0;

	  			usuario.save(function(error, documento){
					if(error){return res.send({estado:false,mensaje:"Error guardando datos."});}
					return res.send({estado:true,mensaje:"Registro actualizado correctamente."});
	  			});

	  		});


	       

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método

/* POST API de logueo por ajax */
router.post('/jseliminarregirstro', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			 var idItem = req.body.id || '';

			   User.remove({_id: idItem}, function(error){
			      if(error){
			        res.send({estado:true,mensaje:"Error al intentar eliminar el registro."});
			      }else{ 
			        return res.send({estado:true,mensaje:"Registro actualizado correctamente."});
			      }
			   });

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método
/* POST API de logueo por ajax */
router.post('/jsactivarregirstro', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			 var idItem = req.body.id || '';

	  		var query = User.findOne({"_id":idItem},function(err, user){

	  			 if(err){console.log('Error recuperando item');}
	  			 
	  			 var estado = 0;
	  			 if(user.estado == 0)
	  			 {estado=1;}else{estado=0;}
	  			var usuario = user;
	  			usuario.estado=estado;

	  			usuario.save(function(error, documento){
					if(error){return res.send({estado:false,mensaje:"Error guardando datos."});}

					if(estado == 0)
					{
						return res.send({estado:true,mensaje:"Registro DESACTIVADO correctamente.",std:estado});
					}else{
						return res.send({estado:true,mensaje:"Registro ACTIVADO correctamente.",std:estado});

					}
	  			});

	  		});


	       

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método


/* POST API de logueo por ajax */
router.post('/jsenviardatos', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			 var idItem = req.body.id || '';

	  		var query = User.findOne({"_id":idItem},function(err, user){

	  			 if(err){console.log('Error recuperando item');}
 
			    var HTML = pug.compileFile("views/emails/email_enviar_datos.pug");
			    var ASUNTO = "Envio de datos de acceso";
			    var DESTINATARIO = user.email;
		 		// configura los datos del correo
		 		Datos.usuario = user.usuario;

				var mailOptions = {from: Datos.site_nombre  + '<' + Datos.site_email + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

				// Envía el correo con el objeto de transporte definido anteriormente
				transporter.sendMail(mailOptions, function(error, info)
					{
					    if(error){  return res.send({estado:false, mensaje:'Ocurrió un error enviando sus datos. - '+ error});     }

						return res.send({estado:true, mensaje:'Los datos han sido enviados al usuario.'});
					});

	  		});


	       

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método

/* POST API de logueo por ajax */
router.get('/test', function(req, res, next) {

		//var COOK = req.cookies.listar_usuarios;
		//	console.log(COOK)
			var query = User.find();


			//if(COOK.texto!=""){query.where('nombre', new RegExp(COOK.texto, 'i') );}
			//if(COOK.tags!=""){query.where('tags').in(COOK.tags);}
			//if(COOK.tags!=""){query.where('tags').in(COOK.tags);}
			query.limit(parseInt(10));
			query.skip(parseInt(0));

			//query.asc('nombre');

			query.exec(function (err, docs) {
			 
    			if(err){console.log('Error recuperando usuarios');}

		     	res.send({estado:true, mensaje:'Petición completa', datos:docs});

			}); 

}); // Cierre de método
// crear un objeto de transporte reutilizable usando SMTP transport
var transporter = nodemailer.createTransport({
	host: Datos.mail_smtp_host, 
	port: Datos.mail_smtp_port ,secure: false, // true for 465, false for other ports
    auth: {user: Datos.mail_smtp_user, pass: Datos.mail_smtp_pass},
    tls: { rejectUnauthorized: false}/* do not fail on invalid certs*/	    
});

module.exports = router;
