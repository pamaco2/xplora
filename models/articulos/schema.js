var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    articulosSchema: new Schema({
								        _id: {type: Schema.Types.ObjectId},
								        nombre: {type: String},
								        alias: {type: String},
								        autor: {type: String},
								        intro: {type: String},
								        descripcion: {type: String},
								        estado: {type: Boolean},
								        privilegio: {type: Number},
								        last_mod: {type: Number},
								        last_editor: {type: String},
								        tags: {type: Object},
								        alta: {type: Date},
								        categoria:{type: Number}
			        
			    						})

			  };

module.exports = schemas;