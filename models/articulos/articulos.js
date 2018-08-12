var mongoose = require('../../config/mongoose');
var articulosSchema = require('../../models/articulos/schema').articulosSchema;

var models = {
				Articulos: mongoose.model('articulos', articulosSchema)
			}

module.exports = models;