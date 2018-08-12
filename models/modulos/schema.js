var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    modulosSchema: new Schema({
								        _id: {type: Schema.Types.ObjectId},
								        nombre: {type: String},
								        posicion: {type: String},
								        vista: {type: String},
								        tipo: {type: Boolean},
								        estado: {type: Boolean},
								        privilegio: {type: Number},
								        fuente: {type: String},
								        parametros: {type: Object},
								        html: {type: String},
								        orden: {type: Number}
			        
			    						})

			  };

module.exports = schemas;