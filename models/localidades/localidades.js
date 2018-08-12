var mongoose = require('../../config/mongoose');
var localidadesSchema = require('../../models/localidades/schema').localidadesSchema;

var models = {

	Localidades: mongoose.model('localidades', localidadesSchema)

};

module.exports = models;