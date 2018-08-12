var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    userSchema: new Schema({
								        usuario: {type: String},
								        pass: {type: String},
								        email: {type: String},
								        nombre: {type: String},
								        apellido: {type: String},
								        imagen: {type: String},
								        estado: {type: Number},
								        privilegio: {type: Number},
									    creado: { 
									        type: Date,
									        default: Date.now
									    },
									    telefono: {type: String},
								        dir_envio: {type: Object},
								        dir_facturacion: {type: Object},
								        token:{type: String}
			        
			    						})

			  };

module.exports = schemas;