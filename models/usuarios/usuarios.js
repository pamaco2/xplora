var mongoose = require('../../config/mongoose');
var userSchema = require('../../models/usuarios/schema').userSchema;

var models = {
				User: mongoose.model('usuarios', userSchema)
			}

module.exports = models;