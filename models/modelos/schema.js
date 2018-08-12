var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    modelosSchema: new Schema({
								        id: {type: Number},
								        id_marca: {type: String},
								        nombre: {type: String}

			        
			    						})

			  };

module.exports = schemas;