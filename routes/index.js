var express = require('express');
var router = express.Router();
var request = require('request');
var bcrypt = require('bcrypt');
var EmailTemplate = require('email-templates');
var async = require('async');
var nodemailer = require('nodemailer');
var fs = require('fs');
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
var Privilegios = require('../models/privilegios/privilegios').Privilegios;



/* GET home page. */
//router.get('/', cache(300),  function(req, res, next) {
	
router.get('/',   function(req, res, next) {
    	
    	res.redirect("catalogo")
});


	



/* GET home page. */
router.get('/editarme',  function(req, res, next) {

	var nvlMetodo = 1; // Nivel del metodo (publico)
	var privilegio = 0;

	// Reescribe privilegios del cliente si existe sesión
    if(req.session.privilegio)	{privilegio = req.session.privilegio;}
			
	// Validando privilegios del usuario
	if(privilegio<nvlMetodo)	{
 	   	var id = "";var url = req.originalUrl || "";
  		res.render('errors/error401', {data:Datos, usuario: req.session.usuario, id:id, target: url  });
	} // Comprobación de privilegios del usuario
	else
	{	// Comprobar captcha


	    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword){

 			var query = User.findOne({"_id":req.session.idusuario}, function (err, user) { if(err){console.log('Error recuperando item');}

				var privAll = Privilegios.findOne({"rango":user.privilegio},function(error, priv)
				{

					var nombrePriv = priv.alias || priv.nombre;
					res.render('editarme', {data:Datos, usuario: req.session.usuario, item:user, userPriv:nombrePriv,});



				});


			});
	    });


	}



}).post("/editarme/jsguardarperfil", function(req, res, next){


	var nvlMetodo = 1; // Nivel del metodo (publico)
	var privilegio = 1;
    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha


	  		var query = User.findOne({"_id":req.session.idusuario},function(err, user){

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

}).post("/editarme/jsguardardireccion", function(req, res, next){


	var nvlMetodo = 1; // Nivel del metodo (publico)
	var privilegio = 0;
    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha


	  		var query = User.findOne({"_id":req.session.idusuario},function(err, user){

	  			 if(err){console.log('Error recuperando item');}

	  			var usuario = user;
	  			if(req.body.datos.direccion!={}){usuario.dir_envio = req.body.datos.direccion;}


	  			usuario.save(function(error, documento){
					if(error){return res.send({estado:false,mensaje:"Error guardando datos."});}
					return res.send({estado:true,mensaje:"Registro actualizado correctamente."});
	  			});

	  		});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}).post("/editarme/jsguardarpass", function(req, res, next){


	var nvlMetodo = 1; // Nivel del metodo (publico)
	var privilegio = 1;
    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha

			var contrasena = rand_codnum(10); // Genera código de confirmación para el usuario
			bcrypt.hash( contrasena , 12).then(function(hashedPassword)
			{// Encriptación de código de confirmación para el usuario

							
			    User.update(
			    	{"_id":req.session.idusuario},
					{pass: hashedPassword}
					).then((rawResponse,) => 
				{ // Código post actualización del usuario

					var query = User.findOne({"_id":req.session.idusuario},function(err, user){

			  			if(err){console.log('Error recuperando item');}
		 
					    var HTML = pug.compileFile("views/emails/email_regen_pass.pug");
					    var ASUNTO = "Envio de datos de acceso";
					    var DESTINATARIO = user.email;
				 		// configura los datos del correo
				 		Datos.usuario = user.usuario;
						Datos.pass = contrasena;

						var mailOptions = {from: Datos.site_nombre  + '<' + Datos.site_email + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

						// Envía el correo con el objeto de transporte definido anteriormente
						transporter.sendMail(mailOptions, function(error, info)
						{
						    if(error){  return res.send({estado:false, mensaje:'Ocurrió un error enviando sus datos. - '+ error});     }

							return res.send({estado:true, mensaje:'Los datos han sido enviados al usuario.'});
						});


	  			    });
	  			});
	  		});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}).post("/editarme/jsuploadavatar", function(req, res, next){

	if (!req.files)
      return res.status(400).send('No files were uploaded.');



    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    var sampleFile = req.files.file;
    var xplode = req.files.file.name.split(".");
    var nombre = xplode[0];
    var extencion = "."+xplode[1];
	var code = rand_codnum(12);
	var nuevoNombre = "avatar_"+code+extencion;

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv('./public/temp/'+nuevoNombre, function(err) {
      if (err){return res.status(500).send(err);}
 
    	var bitmap = fs.readFileSync('./public/temp/'+nuevoNombre);
    	var base64 = new Buffer(bitmap).toString('base64');
		


		 User.update(
			    	{"_id":req.session.idusuario},
					{imagen: "data:image/jpeg;base64,"+base64}
					).then((rawResponse,) => 
				{ // Código post actualización del usuario

					fs.unlink('./public/temp/'+nuevoNombre, function(errs) {
			            if (errs){console.log(errs);}

			      		res.send('File uploaded!');
			      		res.end();
			                        
			        });
					
				});

    });
});


/* GET home page. */
router.get('/contacto', function(req, res, next) {
//router.get('/contacto', cache(300),  function(req, res, next) {

	bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword){Datos.hash= hashedPassword;


 		  res.render('contacto', {data:Datos, usuario: req.session.usuario });
	});



}).post("/contacto",function(req,res,next)
{

	var nombreMetodo = "contacto"; // Nombre del metodo (publico)
	var nvlMetodo = 0; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var url = "https://www.google.com/recaptcha/api/siteverify"+'?secret='+Datos.captcha_key_secret+'&response='+req.body.datos.captcha+'&remoteip='+req.connection.remoteAddress;
				  
			var respons = request(url, function(error, response, body)
			{
				body = JSON.parse(body);
				if(error!=null){console.log(error)}

				if (!body.success){return  res.send({estado:false,mensaje:"Error de captcha"});}else
				{// Recaptcha validado correctamente.

				    var nombre = req.body.datos.nombre || '';
				    var email = req.body.datos.email || '';
				    var mensaje = req.body.datos.mensaje || '';


				    var HTML = pug.compileFile("views/emails/email_contacto.pug");
				    var ASUNTO = "Contacto desde sitio web";
				    var DESTINATARIO = Datos.mail_smtp_destinatario;
			 		// configura los datos del correo
					Datos.envio = {nombre: nombre, email: email, mensaje: mensaje};
					var mailOptions = {from: Datos.site_nombre  + '<' + DESTINATARIO + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

					// Envía el correo con el objeto de transporte definido anteriormente
					transporter.sendMail(mailOptions, function(error, info)
						{
						    if(error){  return res.send({estado:false, mensaje:'Error de envío. - '+ error});     }

							return res.send({estado:true, mensaje:'Su mensaje ha sido enviado.'});
						});
				    

				} // Comprobación de respuesta de recaptcha
		  	});  // Request comprobador del recaptcha

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 


});




/* GET home page. */
router.get('/quienes_somos', function(req, res, next) {
	    var ubicaciones=['all'];
	   Enlace.find().exec(function(error, data){ if(error){console.log('Error recuperando enlaces');}
	    	for(val in data){if("/"+data[val].componente == req.originalUrl){ubicaciones.push(data[val].alias);}}
	   		Modulos.find().where("estado").equals(true).where('sitio').in(ubicaciones).sort({orden:1}).exec(function(error, modulos)	{	if(error){console.log('Error recuperando modulos');}  
	    	   			
  	    		console.log(modulos)
	    		Datos.modulos = modulos; 
 				res.render('quienes_somos', {data:Datos, usuario: req.session.usuario });
	    		
	    	});
    		
    	});

});


/* GET home page. */
router.get('/compare', function(req, res, next) {
	/*
	if(bcrypt.compareSync(req.query.code,req.query.hash))
	{
		return res.send("Son iguales");
	}else
	{

		return res.send("Son iguales Distintos");
	}
*/
});

/* GET home page. */
router.post('/mod', function(req, res, next) {
	
  res.render("mods/"+req.body.modulo,{data:Datos, usuario: req.session.usuario,privilegio: req.session.privilegio });

});


/* GET home page. */
router.get('/mod', function(req, res, next) {
	
//  res.render("mods/"+req.body.modulo,{data:Datos, usuario: req.session.usuario });

});


function rand_code(lon){

	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	code = "";
	for (x=0; x < lon; x++)
	{
		rand = Math.floor(Math.random()*chars.length);
		code += chars.substr(rand, 1);
	}

	var especiales = "#@!_";
	for (x=0; x < 1; x++)
	{
		rand = Math.floor(Math.random()*especiales.length);
		code += especiales.substr(rand, 1);
	}

	return code;
}
function rand_codnum(lon){

	var chars = "1234567890";
	code = "";
	for (x=0; x < lon; x++)
	{
		rand = Math.floor(Math.random()*chars.length);
		code += chars.substr(rand, 1);
	}

	var especiales = "";
	for (x=0; x < 1; x++)
	{
		rand = Math.floor(Math.random()*especiales.length);
		code += especiales.substr(rand, 1);
	}

	return code;
}



// crear un objeto de transporte reutilizable usando SMTP transport
var transporter = nodemailer.createTransport({
	host: Datos.mail_smtp_host, 
	port: Datos.mail_smtp_port ,secure: false, // true for 465, false for other ports
    auth: {user: Datos.mail_smtp_user, pass: Datos.mail_smtp_pass},
    tls: { rejectUnauthorized: false}/* do not fail on invalid certs*/	    
});


var Email = function()
{
	var html = null;
	var asunto = null;
	var estado = null;
	
	// crear un objeto de transporte reutilizable usando SMTP transport
	var transporter = nodemailer.createTransport({
		host: Datos.mail_smtp_host, port: Datos.mail_smtp_port ,secure: false, // true for 465, false for other ports
	    auth: {user: Datos.mail_smtp_user, pass: Datos.mail_smtp_pass},
	    tls: { rejectUnauthorized: false}/* do not fail on invalid certs*/	    
	});

	this.setTmpl = function(p){   html = pug.compileFile(p);	}

	this.setAsunto = function(a){	asunto = a;	}
	
	this.send = function(dest, dts){
		estado = {estado:null,menaje:"enviando"};
		// configura los datos del correo
		var mailOptions = {from: Datos.site_nombre +'<'+Datos.site_email+'>', to: dest, subject: asunto,html: html({data:dts})};

		// Envía el correo con el objeto de transporte definido anteriormente
		transporter.sendMail(mailOptions, function(error, info)
			{
			    if(error){  estado = {estado:false,mensaje:error};    }

				estado = {estado:true,mensaje:"El email ha sido enviado."};
			});
		}

	this.getStd = function(){	return estado; }

}

module.exports = router;
