var mongoose = require('../../config/mongoose');
var privilegiosSchema = require('../../models/privilegios/schema').privilegiosSchema;

var models = {
				Privilegios: mongoose.model('privilegios', privilegiosSchema)
			}

module.exports = models;