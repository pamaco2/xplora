var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    paisesSchema: new Schema({
									        provincias: {type: []},
									        nombre: {type: String},
									        codigo: {type: String},
									        estado: {type: Boolean}
									    })

			  }

module.exports = schemas;