var mongoose = require('../../config/mongoose');
var paisesSchema = require('../../models/paises/schema').paisesSchema;

var models = {

	Paises: mongoose.model('paises', paisesSchema)

};

module.exports = models;