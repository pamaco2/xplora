var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    versionesSchema: new Schema({
								        id: {type: Number},
								        id_modelo: {type: String},
								        nombre: {type: String}
			    						})

			  };

module.exports = schemas;