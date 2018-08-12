var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    localidadesSchema: new Schema({
									        id_provincia: {type: String},
									        nombre: {type: String},
									        cp: {type: String}
									    })

			  }

module.exports = schemas;