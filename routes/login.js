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

/* configuración del sistema */

/* configuración del locales */
var Pais = require('../models/paises/paises').Paises;

/* gestión de usuario */
var User = require('../models/usuarios/usuarios').User;

/* gestión de enlaces */
var Enlace = require('../models/enlaces/enlaces').Enlace;


/* GET home page. */
router.get('/login', function(req, res, next) {
	
    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword) {
    
    	Datos['hash'] = hashedPassword;

		if(req.session.usuario)
			{
		  		res.render('login/cerrarlogin',  {data:Datos, usuario: req.session.usuario });
			}else{
				var id = req.query.id || "";
				var url = req.query.target || "";
				
		  		res.render('login/formlogin',  {data:Datos, usuario: req.session.usuario, target:url, id:id });
			}

    });

});

/* GET pagina de recuperación de contraseña. */
router.get('/lostpass', function(req, res, next) {
    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword) {
    	Datos['hash'] = hashedPassword;
 		res.render('login/lostpass/lost_pass',  {data:Datos, usuario: req.session.usuario });
    });
});

/* GET pagina de recuperación de contraseña. */
router.get('/signup', function(req, res, next) {
    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword) {
    	Datos.hash = hashedPassword;
    

		if(req.session.usuario)
		{
			res.render('login/signup/cerrarlogin',  {data:Datos, usuario: req.session.usuario });
		}else{

			res.render('login/signup/signup_simple',  {data:Datos, usuario: req.session.usuario });
		}
    });

}).post('/signup', function(req, res, next) 
{
    //bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword) {Datos['hash'] = hashedPassword;});
	
	var nvlMetodo = 0; // Nivel del metodo (publico)
	var privilegio = 0;
    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha

			var url = "https://www.google.com/recaptcha/api/siteverify"+'?secret='+Datos.captcha_key_secret+'&response='+req.body.datos.captcha+'&remoteip='+req.connection.remoteAddress;
				  
			var respons = request(url, function(error, response, body)
			{
				body = JSON.parse(body);
				if(error!=null){console.log(error)}

				if (!body.success){return  res.send({estado:false,mensaje:"Error de captcha"});}else
				{// Recaptcha validado correctamente.

					// ----------------- DESDE AQUI SCRIPT ----------------------
				    var username = req.body.datos.usuario || '';
					User.find({usuario:username},{usuario:1,nombre:1,apellido:1,email:1,pass:1,estado:1,privilegio:1}).exec(function(err, data)
					{

						if(data.length!=0){ return res.send({estado:false,mensaje:"El nombre de usuario ya está en uso."}); }else
						{ 
							var tokenActivacion = rand_codnum(32); // Genera código de confirmación para el usuario
							bcrypt.hash( tokenActivacion , 12).then(function(hashedPassword)
							{// Encriptación de código de confirmación para el usuario





							    User({
									nombre: req.body.datos.nombre,
							    	apellido: req.body.datos.apellido,
							    	usuario: req.body.datos.usuario,
							    	email: req.body.datos.usuario,
							    	pass: "",
							    	estado: 0,
							    	privilegio: 1,
							    	telefono: req.body.datos.telefono,
							    	dir_envio: {calle:"",nro:"", localidad:"",cp:"",pais:"",provincia:""},
							    	dir_facturacion: {calle:"",nro:"", localidad:"",cp:"",pais:"",provincia:""},
							    	token: hashedPassword

							   
							   }).save(function(error, documento)
								{
    							    if(error){ return res.send({estado:false, mensaje:'Error creando registrando usuario.'}); } 



    							    var HTML = pug.compileFile("views/emails/email_usuario_registrado.pug");
    							    var ASUNTO = "Registro de usuario";
    							    var DESTINATARIO = req.body.datos.usuario;
							 		// configura los datos del correo
							 		Datos.usuario = req.body.datos.usuario;
							 		Datos.token = tokenActivacion;
									var mailOptions = {from: Datos.site_nombre  + '<' + Datos.site_email + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

									// Envía el correo con el objeto de transporte definido anteriormente
									transporter.sendMail(mailOptions, function(error, info)
										{
										    if(error){  return res.send({estado:false, mensaje:'Usuario creado con éxito, pero ocurrió un error enviando sus datos. - '+ error});     }

											return res.send({estado:true, mensaje:'Usuario creado con éxito'});
										});
   							    
									
								      
								});


	
							});// Cierre de bcrypt.hash()
						} // Comprobación de usuario libre

					});	// Cierre User.find()			

					// ----------------- HASTA AQUI SCRIPT ----------------------

				} // Comprobación de respuesta de recaptcha
		  	});  // Request comprobador del recaptcha

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}).post('/crearusuario', function(req, res, next) 
{
    //bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword) {Datos['hash'] = hashedPassword;});
	
	var nvlMetodo = 0; // Nivel del metodo (publico)
	var privilegio = 0;
    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privilegio = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha

			// ----------------- DESDE AQUI SCRIPT ----------------------
		    var username = req.body.datos.usuario || '';
			User.find({usuario:username},{usuario:1,nombre:1,apellido:1,email:1,pass:1,estado:1,privilegio:1}).exec(function(err, data)
			{

				if(data.length!=0){ return res.send({estado:false,mensaje:"El nombre de usuario ya está en uso."}); }else
				{ 
					var tokenActivacion = rand_codnum(32); // Genera código de confirmación para el usuario
					bcrypt.hash( tokenActivacion , 12).then(function(hashedPassword)
					{// Encriptación de código de confirmación para el usuario

					    User({
							nombre: req.body.datos.nombre,
					    	apellido: req.body.datos.apellido,
					    	usuario: req.body.datos.usuario,
					    	email: req.body.datos.usuario,
					    	pass: "",
					    	estado: 0,
					    	privilegio: 1,
					    	telefono: req.body.datos.telefono,
					    	dir_envio: req.body.datos.envio || {},
					    	dir_facturacion: req.body.datos.facturacion ||{},
					    	token: hashedPassword

					   
					   }).save(function(error, documento)
						{
						    if(error){ return res.send({estado:false, mensaje:'Error creando registrando usuario.'}); } 



						    var HTML = pug.compileFile("views/emails/email_usuario_registrado.pug");
						    var ASUNTO = "Registro de usuario";
						    var DESTINATARIO = req.body.datos.usuario;
					 		// configura los datos del correo
					 		Datos.usuario = req.body.datos.usuario;
					 		Datos.token = tokenActivacion;
							var mailOptions = {from: Datos.site_nombre  + '<' + Datos.site_email + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

							// Envía el correo con el objeto de transporte definido anteriormente
							transporter.sendMail(mailOptions, function(error, info)
								{
								    if(error){  return res.send({estado:false, mensaje:'Usuario creado con éxito, pero ocurrió un error enviando sus datos. - '+ error});     }

									return res.send({estado:true, mensaje:'Usuario creado con éxito'});
								});
						    
							
						      
						});



					});// Cierre de bcrypt.hash()
				} // Comprobación de usuario libre

			});	// Cierre User.find()			

			// ----------------- HASTA AQUI SCRIPT ----------------------

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

});  // Cierre de método





/* GET pagina de recuperación de contraseña. */
router.get('/signup_confirmacion', function(req, res, next) {
	res.render('login/signup/signup_confirmacion_registro',  {data:Datos, usuario: req.session.usuario });
});

/* GET pagina de recuperación de contraseña. */
router.get('/signup_activacion', function(req, res, next) {



	Datos.usuario = req.query.user;
	Datos.token = req.query.token;
	User.find({usuario:Datos.usuario},{usuario:1,nombre:1,apellido:1,email:1,pass:1,estado:1,privilegio:1,token:1}).exec(function(err, data)
	{

		if(data.length==0){ res.render('login/signup/signup_activacion_registro_nouser',  {data:Datos, usuario: req.session.usuario }); }else
		{ 

			if(data[0].estado==1){ res.render('login/signup/signup_activacion_registro_useract',  {data:Datos, usuario: req.session.usuario }); }else
			{

				if(!bcrypt.compareSync(Datos.token,data[0].token)){ res.render('login/signup/signup_activacion_registro_notoken',  {data:Datos, usuario: req.session.usuario }); }else
				{   // Reescribe privilegios del cliente si existe sesión


							var contrasena = rand_codnum(10); // Genera código de confirmación para el usuario
							bcrypt.hash( contrasena , 12).then(function(hashedPassword)
							{// Encriptación de código de confirmación para el usuario

								
							    User.update(
							    	{usuario:data[0].usuario},
									{pass: hashedPassword, estado: 1,token: ""}
									).then((rawResponse,) => 
								{ // Código post actualización del usuario

									console.log(rawResponse)

    							    //if(error){ res.render('login/signup_activacion_registro_useract',  {data:Datos, usuario: req.session.usuario }); } 

    							    var HTML = pug.compileFile("views/emails/email_usuario_confirmado.pug");
    							    var ASUNTO = "Activación de usuario";
    							    var DESTINATARIO = data[0].usuario;
							 		// configura los datos del correo
							 		Datos.usuario = data[0].usuario;
							 		Datos.pass = contrasena;
									var mailOptions = {from: Datos.site_nombre  + '<' + Datos.site_email + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

									// Envía el correo con el objeto de transporte definido anteriormente
									transporter.sendMail(mailOptions, function(error, info)
										{
										    if(error){  res.render('login/signup/signup_activacion_registro_email',  {data:Datos, usuario: req.session.usuario });    }

											res.render('login/signup/signup_activacion_registro_ok',  {data:Datos, usuario: req.session.usuario }); 
										});
   							    
									
								      
								});
							});// Cierre de bcrypt.hash()

  				}  // Comprobación estado de token
			} // Comprobación estado de cuenta
		} // Comprobación email asociado



	});

});


/* POST API de logueo por ajax */
router.post('/jsloguear', function(req, res, next) {

	var nombreMetodo = "jsloguear"; // Nombre del metodo (publico)
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

				    var username = req.body.datos.usuario || '';
				    var pass = req.body.datos.pass || '';

					User.find({usuario:username},{usuario:1,nombre:1,apellido:1,email:1,pass:1,estado:1,privilegio:1}).exec(function(err, data)
					{

						if(data.length==0){ return res.send({estado:false,mensaje:"El usuario no está asociado a ninguna cuenta."}); }else
						{ 

							if(data[0].estado==0){ return res.send({estado:false,mensaje:"Cuenta suspendida."}); }else
							{
								if(!bcrypt.compareSync(pass, data[0].pass)){ return res.send({estado:false,mensaje:"Datos de acceso incorrectos."}); }else
								{
									// -------------- Inicia sesión con éxito ---------------- 
						 			 req.session.idusuario=data[0]._id;
						 			 req.session.usuario=data[0].usuario;
						 			 req.session.email=data[0].email;
						 			 req.session.nombre=data[0].nombre;
						 			 req.session.apellido=data[0].apellido;
						 			 req.session.privilegio=data[0].privilegio;

									// -------------- Inicia sesión con éxito ---------------- 

							  		return res.send({estado:true,mensaje:"Sesión iniciada con éxito."});

								}// Comprobación de contraseña
							} // Comprobación estado de cuenta
						} // Comprobación email asociado
						

					}); // Cierre User.find()

				} // Comprobación de respuesta de recaptcha
		  	});  // Request comprobador del recaptcha

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método


/* POST API de cierre de sesión. */
router.post('/jscerrarsesion', function(req, res, next) {
	
	var nombreMetodo = "jscerrarsesion"; // Nombre del metodo (publico)
	var nvlMetodo = 1; // Nivel del metodo (publico)

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
		console.log(Datos.privilegio);
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha

			if(req.session.usuario){
				console.log(req.session.usuario +' cerró sesión');
				req.session.destroy();
		    	res.send({estado:true,mensaje:"Sesión cerrada con éxito."});
			}else
			{
		    	res.send({estado:true,mensaje:"No es necesario, la session no existe."});
			}
		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

});


/* POST página de prerecup. */
router.post('/jsprerecuperar', function(req, res, next) 
{
	
	var nombreMetodo = "jsprerecuperar"; // Nombre del metodo (publico)
	var nvlMetodo = 0; // Nivel del metodo (publico)
    

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión

		User.find({usuario:req.body.datos.email},{usuario:1,nombre:1,apellido:1,email:1,pass:1,estado:1,privilegio:1,token:1}).exec(function(err, data)
		{
			if(data.length==0){ return res.send({estado:false,mensaje:"Imposible iniciar proceso de recuperación."}); }else
			{ 

				if(data[0].estado==0){ return res.send({estado:false,mensaje:"Imposible iniciar proceso de recuperación.(Cuenta suspendida)"}); }else
				{

					var url = "https://www.google.com/recaptcha/api/siteverify"+'?secret='+Datos.captcha_key_secret+'&response='+req.body.datos.captcha+'&remoteip='+req.connection.remoteAddress;
					var respons = request(url, function(error, response, body) 
					{
						body = JSON.parse(body);
						if(error!=null){ console.log(error); }
					  	
						if (!body.success){return  res.send({estado:false,mensaje:"El formulario no superó el desafio de seguridad.(Recaptcha)"});}else
						{// Recaptcha validado correctamente.
						
							// ----------------- DESDE AQUI SCRIPT ----------------------

							var codeNum = rand_codnum(4); // Genera código de confirmación para el usuario
							bcrypt.hash( codeNum , 12).then(function(hashedPassword)
							{// Encriptación de código de confirmación para el usuario

							    // Actualización del usuario(Se almacena codigo en documento del usuario)
								User.update(
								  {email:req.body.datos.email},
								  {token:hashedPassword}
								).then((rawResponse,) => 
								{ // Código post actualización del usuario
									// Despues de la actualización, se envia al usuario un email para que confirme la operación

		    							    var HTML = pug.compileFile("views/emails/email_lost_pass_code.pug");
		    							    var ASUNTO = "Recuperación de contraseña";
		    							    var DESTINATARIO = req.body.datos.email;
									 		// configura los datos del correo
									 		Datos.usuario = req.body.datos.email;
									 		Datos.token = codeNum;

											var mailOptions = {from: Datos.site_nombre  + '<' + Datos.site_email + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

											// Envía el correo con el objeto de transporte definido anteriormente
											transporter.sendMail(mailOptions, function(error, info)
												{
												    if(error){  return res.send({estado:false,mensaje:error});    }
													console.log(info)

													return res.send({estado:true,mensaje:"Proceso de recuperación iniciado, por favor siga las instrucciones desde su bandeja de entrada."});
												});

								

								}).catch((err) => 
								{// Error de la actualización del usuario (Update) 
													console.log(err)
										return res.send({estado:false,mensaje:err});
								});
								
							}); // Cierre bcrypt (Creación de codigo de confirmación) 


							// ----------------- HASTA AQUI SCRIPT ----------------------

						} // Comprobación de respuesta de recaptcha
					}); // Request comprobador del recaptcha
				}
			}
			}); // Request comprobador del recaptcha


	} // Comprobación de hash(petición ajax) 

});  // Cierre de método

/* POST página de recup. */
router.get('/confirmarecup',function(req, res, next)
{

	Datos.usuario = req.query.usuario;
	Datos.token = req.query.token;
	User.find({usuario:Datos.usuario},{usuario:1,nombre:1,apellido:1,email:1,pass:1,estado:1,privilegio:1,token:1}).exec(function(err, data)
	{

		if(data.length==0){ res.render('login/lostpass/lostpass_recuperacion_nouser',  {data:Datos, usuario: req.session.usuario }); }else
		{ 

									
			if(data[0].estado==0){ res.render('login/lostpass/lostpass_recuperacion_useract',  {data:Datos, usuario: req.session.usuario }); }else
			{

				if(!bcrypt.compareSync(Datos.token,data[0].token)){ res.render('login/lostpass/lostpass_recuperacion_notoken',  {data:Datos, usuario: req.session.usuario }); }else
				{   // Reescribe privilegios del cliente si existe sesión


							var contrasena = rand_codnum(10); // Genera código de confirmación para el usuario
							bcrypt.hash( contrasena , 12).then(function(hashedPassword)
							{// Encriptación de código de confirmación para el usuario

								
							    User.update(
							    	{usuario:data[0].usuario},
									{pass: hashedPassword, token: ""}
									).then((rawResponse,) => 
								{ // Código post actualización del usuario


    							    //if(error){ res.render('login/signup_activacion_registro_useract',  {data:Datos, usuario: req.session.usuario }); } 

    							    var HTML = pug.compileFile("views/emails/email_lost_pass.pug");
    							    var ASUNTO = "Recuperación de contraseña";
    							    var DESTINATARIO = data[0].usuario;
							 		// configura los datos del correo
							 		Datos.usuario = data[0].usuario;
							 		Datos.pass = contrasena;
									var mailOptions = {from: Datos.site_nombre  + '<' + Datos.site_email + '>', to: DESTINATARIO, subject: ASUNTO,html: HTML({data:Datos})};

									// Envía el correo con el objeto de transporte definido anteriormente
									transporter.sendMail(mailOptions, function(error, info)
										{
										    if(error){  res.render('login/lostpass/lostpass_recuperacion_email',  {data:Datos, usuario: req.session.usuario });    }

											res.render('login/lostpass/lostpass_recuperacion_ok',  {data:Datos, usuario: req.session.usuario }); 
										});
   							    
									
								      
								});
							});// Cierre de bcrypt.hash()

  				}  // Comprobación estado de token
			} // Comprobación estado de cuenta
		} // Comprobación email asociado



	});


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


/* POST API de cierre de sesión. */
router.post('/getpaises', function(req, res, next) {
	
	var nombreMetodo = "getpaises"; // Nombre del metodo (publico)
	var nvlMetodo = 0; // Nivel del metodo (publico)

    // Validando instancia
	if(false){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{  // Comprobar captcha
		
		    Pais.find().where("estado").equals(true).sort({nombre:1}).exec(function(error, data)
		    {
		    	
		      if(error){
		         console.log('Error recuperando paises');
		      }else{
		         Datos.paises = data;
		      }

		    });

			res.render('paises',{paises:Datos.paises,data: Datos});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

});

/* POST API de cierre de sesión. */
router.post('/getprovincias', function(req, res, next) {
	
	var nombreMetodo = "getprovincias"; // Nombre del metodo (publico)
	var nvlMetodo = 0; // Nivel del metodo (publico)

    // Validando instancia
	if(false){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{Datos.privilegio = req.session.privilegio;}
		// Validando privilegios del usuario
		if(Datos.privilegio<nvlMetodo){ return  res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{  // Comprobar captcha


		    Pais.find().where("estado").equals(true).sort({nombre:1}).exec(function(error, data)
		    {
		    	
		      if(error){
		         console.log('Error recuperando paises');
		      }else{
		         Datos.paises = data;
		      }

		    });

			var codePais = req.body.codepais;
			//var codePais = req.query.code;
			var pais = null;
			for (i=0; i<Datos.paises.length; i++) 
			{
				if(Datos.paises[i].codigo==codePais)
				{
					pais = Datos.paises[i];
				}
			}

			var provincias = [];
			for (i=0; i<pais.provincias.length; i++) {
				if(pais.provincias[i].estado)
				{
					provincias.push(pais.provincias[i]);
				}
				
			}
			//res.send("provincias")
			res.render('provincias',{provincias:provincias,data: Datos});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

});


// crear un objeto de transporte reutilizable usando SMTP transport
var transporter = nodemailer.createTransport({
	host: Datos.mail_smtp_host, 
	port: Datos.mail_smtp_port ,secure: false, // true for 465, false for other ports
    auth: {user: Datos.mail_smtp_user, pass: Datos.mail_smtp_pass},
    tls: { rejectUnauthorized: false}/* do not fail on invalid certs*/	    
});

module.exports = router;
