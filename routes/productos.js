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

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;
    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword)
    {
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
  		if(privUser < nvlMetodo){ res.render('errors/error401', {data:Datos, usuario: req.session, id:req.query.id || "", target: req.originalUrl || ""  });}else
  		{

		    var privAll = Productos.find({});
				privAll.exec(function (error, privs) {
					if(error){console.log('Error recuperando usuarios');}
	     			res.render('productos/index', {data:Datos, sesion: req.session, privilegios: privs});
 				});
	
		}

	});

});



/* GET users listing. */
router.get('/item', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;
    bcrypt.hash(Datos.codejs, 10).then(function(hashedPassword)
    {
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
  		if(privUser < nvlMetodo){ res.render('errors/error401', {data:Datos, usuario: req.session, id:req.query.id || "", target: req.originalUrl || ""  });}else
  		{		    

		    idItem = req.query.id;
 			var query = Productos.findOne({"_id":idItem}, function (err, doc) { if(err){console.log('Error recuperando item');}

				if(doc.length==0)
				{

				   	var id =  "";var url = req.originalUrl || "";
			  		res.render('errors/error404', {data:Datos, usuario: req.session.usuario, id:id, target: url  });

				}else{

					fs.readdir("./public/productos/"+doc.alias+"/thumb",function(errFs, files){
					   
					   if (errFs) {
					        console.error(errFs);
					   }
					   if(files)
					   {
						   files.forEach( function (file){console.log( file );});
					   }else
					   {
					   	  file = "";
					   }
					
					  res.render('productos/item', {data:Datos, item:doc, sesion: req.session, imagenes:files});
					});

				}
       		});
		}
    });

});

/* POST API de logueo por ajax */
router.post('/jslistaitems', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ return  res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var COOK = JSON.parse(req.cookies.listar_productos);
			var PAG = COOK.pagina * COOK.limit;
			var PPAG = COOK.limit;
			

			var PAGS = 1;

 			var query = Productos.find({$or: [{nombre:new RegExp(COOK.texto, 'i') },{apellido:new RegExp(COOK.texto, 'i') },{usuario:new RegExp(COOK.texto, 'i') }]});

			if(COOK.tags!=""){query.where('tags').in(COOK.tags);}
			
			//query.asc('nombre');

			query.exec(function (err, docsAll) {
				

				if(err){console.log('Error recuperando items');}

 				//var queryII = User.find({apellido: new RegExp(COOK.texto, 'i')});
 				var queryII = Productos.find({$or: [{nombre:new RegExp(COOK.texto, 'i') },{apellido:new RegExp(COOK.texto, 'i') },{usuario:new RegExp(COOK.texto, 'i') }]});
 				var cantidadItems = docsAll.length;
 				if(cantidadItems>PPAG){
 					var factor = cantidadItems % PPAG;
 					PAGS = parseInt(cantidadItems / PPAG);
 					if(factor!=0)
 					{
 						PAGS++;
 					}

 				}

				if(COOK.tags!=""){queryII.where('tags').in(COOK.tags);}

				//queryII.asc('apellido');
				queryII.limit(PPAG);
				queryII.skip(PAG);

  				queryII.sort('nombre');
  				//queryII.sort('nombre');

				queryII.exec(function (errr, docsSelect) {
					if(errr){console.log('Error recuperando items');}
 							res.json({estado:true, mensaje:'Petición completa', datos:docsSelect, paginacion: PAGS, pagina: COOK.pagina});
			     			res.end();
				});
			});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método

/* POST API de logueo por ajax */
router.post('/jssavedatos', function(req, res, next) {
	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var idItem = req.body.datos._id ;
			var datos = req.body.datos;
	  		var query = Productos.findOne({"_id":idItem},function(err, item){

	  			 if(err){console.log('Error recuperando item');}

	  			var prod = item;
	  			prod.nombre = datos.nombre;
	  			prod.intro = datos.intro;
	  			prod.descripcion = datos.descripcion;
	  			prod.precio = datos.precio;
	  			prod.stock = datos.stock;
	  			prod.video = datos.video;
 			
	  			prod.save(function(error, documento){
					if(error){res.send({estado:false,mensaje:"Error guardando datos."});}
					res.send({estado:true,mensaje:"Registro actualizado correctamente.", datos:documento});
	  			});

	  		});


	       

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 


}); // Cierre de método


/* POST API de logueo por ajax */
router.post('/jssetimg', function(req, res, next) {
	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var idItem = req.body.datos._id ;
			var datos = req.body.datos;
	  		var query = Productos.findOne({"_id":idItem},function(err, item){

	  			 if(err){console.log('Error recuperando item');}

	  			var prod = item;
	  			prod.imagen = datos.imagen;

 			
	  			prod.save(function(error, documento){
					if(error){res.send({estado:false,mensaje:"Error guardando datos."});}
					res.send({estado:true,mensaje:"Registro actualizado correctamente.", datos:documento});
	  			});

	  		});


	       

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 


}); // Cierre de método

/* POST API de logueo por ajax */
router.post('/jsencatalogo', function(req, res, next) {
	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var idItem = req.body.datos._id ;
			var datos = req.body.datos;
	  		var query = Productos.findOne({"_id":idItem},function(err, item){

	  			if(err){console.log('Error recuperando item');}

	  			var prod = item;
	  			prod.estado = datos.estado;
 			
	  			prod.save(function(error, documento){
					if(error){res.send({estado:false,mensaje:"Error guardando datos."});}
					res.send({estado:true,mensaje:"Registro actualizado correctamente.", datos:documento});
	  			});

	  		});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 


}); // Cierre de método


router.post("/jsuploadimagen", function(req, res, next){

	if (!req.files)
      return res.status(400).send('No files were uploaded.');


    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    var sampleFile = req.files.file;
    var path = req.body.path;

    var xplode = req.files.file.name.split(".");
    var nombre = xplode[0];
    var extencion = "."+xplode[1];
	var code = rand_codnum(6);
	var nuevoNombre = "product_"+req.body.path+"_"+code+extencion;

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv('./public/productos/'+path+'/img/'+nuevoNombre, function(err) {
	    sampleFile.mv('./public/productos/'+path+'/thumb/'+nuevoNombre, function(err) {

  		if (err){console.log(err);return res.status(500).send(err);}
 		//var bitmap = fs.readFileSync('./public/temp/'+nuevoNombre);
		// var base64 = new Buffer(bitmap).toString('base64');

  		res.send({estado:true,mensaje:'Archivo cargado!', datos:nuevoNombre});
  		res.end();

    	});
    });
});

router.post("/jseliminarimg", function(req, res, next){

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    var path = req.body.datos.path;
    var imagen = req.body.datos.imagen;

    // Use the mv() method to place the file somewhere on your server
    fs.unlink('./public/productos/'+path+'/thumb/'+imagen, function(err) {
  	  fs.unlink('./public/productos/'+path+'/img/'+imagen, function(err) {

  		if(err){console.log(err);return res.status(500).send(err);}

  		res.send({estado:true,mensaje:'Archivo eliminado!'});
  		res.end();

  	  });
    });
});



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
router.post('/jscrearitem', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var nombreItem = req.body.datos.nombre ;
			var nuevoAlias = req.body.datos.alias ;
			
  			Productos.find({"alias":nuevoAlias},function(err, doc2){
  				if(doc2.length!=0)
  				{
					res.send({estado:false,mensaje:"Error el alias ya existe."});
  				}else{

					var nuevoI = new Productos({
						nombre:nombreItem,
						alias:nuevoAlias
					});

	  				nuevoI.save(function(error,nuevo){
  						if(error){console.log(error);res.send({estado:false,mensaje:"Error creando item."});}
  						fs.mkdir('./public/productos/'+nuevoAlias, function(errfs)
  						{

  							if(errfs){console.log(errfs);res.send({estado:false,mensaje:"Error creando dir del item."});}
	  						fs.mkdir('./public/productos/'+nuevoAlias+'/img', function(errfs)
  							{
	  							fs.mkdir('./public/productos/'+nuevoAlias+'/thumb', function(errfs)
	  							{
									res.send({estado:true,mensaje:"Item creado correctamente.", datos:nuevo});
  								});
  							});
  						});
  					});
  				}

  			});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método



/* POST API de logueo por ajax */
router.post('/jsduplicaritem', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
	
			var nombreItem = req.body.datos.nombre ;
			var nuevoAlias = req.body.datos.alias ;
			var aliasOrigin = req.body.datos.origin ;
			
  			Productos.find({"alias":nuevoAlias},function(err, doc){
  				if(doc.length!=0)
  				{
					res.send({estado:false,mensaje:"Error el alias ya existe."});
  				}else{
  				

  					Productos.findOne({"alias":aliasOrigin},function(err, doc2){

  						var temp = {};
						temp.nombre= doc2.nombre;
						temp.alias= nuevoAlias;
						temp.precio= doc2.precio;
						temp.stock= doc2.stock;
						temp.imagen= doc2.imagen;
						temp.intro= doc2.intro;
						temp.descripcion= doc2.descripcion;

						var nuevoI = new Productos(temp);
		  				nuevoI.save(function(error,nuevo){
	  						if(error){console.log(error);res.send({estado:false,mensaje:"Error creando item."});}
	  						
	  						fs.mkdir('./public/productos/'+nuevoAlias, function(errfs)
	  						{

	  							if(errfs){console.log(errfs);res.send({estado:false,mensaje:"Error creando dir del item."});}
		  						fs.mkdir('./public/productos/'+nuevoAlias+'/img', function(errfs)
	  							{

		  							fs.mkdir('./public/productos/'+nuevoAlias+'/thumb', function(errfs)
		  							{

		  								fs.readdir('./public/productos/'+aliasOrigin+'/thumb',function(errFs, files){
		  								   if (errFs) {console.error(errFs);}
										   if(files)
											{
											   files.forEach( function (file){
													fs.copyFileSync('./public/productos/'+aliasOrigin+'/thumb/'+file, './public/productos/'+nuevoAlias+'/thumb/'+file);
											   });
											}
							
			  								fs.readdir('./public/productos/'+aliasOrigin+'/img',function(errFsI, filesI){
			  								   if (errFsI) {console.error(errFsI);}
											   if(filesI)
												{
												   filesI.forEach( function (fileI){
														fs.copyFileSync('./public/productos/'+aliasOrigin+'/img/'+fileI, './public/productos/'+nuevoAlias+'/img/'+fileI);
												   });
												}
												res.send({estado:true,mensaje:"Item creado correctamente.", datos:nuevo});
			  								});
		  								});

	  								});
	  							});
	  						});
	  					});
  					});

  				}

  			});

		} // Comprobación de privilegios del usuario
	} // Comprobación de hash(petición ajax) 

}); // Cierre de método


/* POST API de logueo por ajax */
router.post('/jseliminaritem', function(req, res, next) {

	var nvlMetodo = 4; // Nivel del metodo (publico)
	var privUser = 0;

    // Validando instancia
	if(!bcrypt.compareSync(Datos.codejs ,req.body.hash)){ res.send({estado:false,mensaje:"Error de instancia."});/* Error de instancia */ }else
	{   // Reescribe privilegios del cliente si existe sesión
	    if(req.session.privilegio)	{privUser = req.session.privilegio;}
				
		// Validando privilegios del usuario
		if(privUser<nvlMetodo){ res.send({estado:false,mensaje:"Privilegios insuficientes."});/* No autorizado (401) */	}else
		{	// Comprobar captcha
			var item = req.body.datos ;

  			Productos.remove({"_id":item._id},function(err){

				if(err){console.log(err);res.send({estado:false,mensaje:"Error eliminando item"+item.nombre, datos:err});}
				removeFolder("./public/productos/"+item.alias, next);
				res.send({estado:true,mensaje: item.nombre + " eliminando correctamente.", datos:item});

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

var normalize = (function() {
  var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç", 
      to   = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc",
      mapping = {};
 
  for(var i = 0, j = from.length; i < j; i++ )
      mapping[ from.charAt( i ) ] = to.charAt( i );
 
  return function( str ) {
      var ret = [];
      for( var i = 0, j = str.length; i < j; i++ ) {
          var c = str.charAt( i );
          if( mapping.hasOwnProperty( str.charAt( i ) ) )
              ret.push( mapping[ c ] );
          else
              ret.push( c );
      }      
      //return ret.join( '' );
	  return ret.join( '' ).replace( /[^-A-Za-z0-9]+/g, '-' ).toLowerCase();
  }
 
})();
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
function removeFolder(location, next) {
    fs.readdir(location, function (err, files) {
        async.each(files, function (file, cb) {
            file = location + '/' + file
            fs.stat(file, function (err, stat) {
                if (err) {
                    return cb(err);
                }
                if (stat.isDirectory()) {
                    removeFolder(file, cb);
                } else {
                    fs.unlink(file, function (err) {
                        if (err) {
                            return cb(err);
                        }
                         cb();
                    })
                }
            })
        }, function (err) {
            if (err) return next(err)
            fs.rmdir(location, function (err) {
                 next(err)
            })
        })
    })
}
module.exports = router;
