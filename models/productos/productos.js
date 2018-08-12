var mongoose = require('../../config/mongoose');
var productosSchema = require('../../models/productos/schema').productosSchema;

var models = {
				Productos: mongoose.model('productos', productosSchema)
			}

module.exports = models;