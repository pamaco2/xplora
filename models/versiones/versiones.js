var mongoose = require('../../config/mongoose');
var versionesSchema = require('../../models/versiones/schema').versionesSchema;

var models = {
				Versiones: mongoose.model('versiones', versionesSchema)
			}

module.exports = models;