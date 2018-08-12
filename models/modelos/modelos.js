var mongoose = require('../../config/mongoose');
var modelosSchema = require('../../models/modelos/schema').modelosSchema;

var models = {
				Modelos: mongoose.model('modelos', modelosSchema)
			}

module.exports = models;