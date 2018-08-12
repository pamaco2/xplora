var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    privilegiosSchema: new Schema({
								        _id: {type: Object},
								        nombre: {type: String},
								        rango: {type: Number},
								        alias: {type: String},
								        descripcion: {type: String}			        
			    						})

			  };

module.exports = schemas;