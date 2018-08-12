var mongoose = require('../../config/mongoose');
var modulosSchema = require('../../models/modulos/schema').modulosSchema;

var models = {
				Modulos: mongoose.model('modulos', modulosSchema)
			}

module.exports = models;