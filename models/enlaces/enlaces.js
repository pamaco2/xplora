var mongoose = require('../../config/mongoose'),
  enlaceSchema = require('../../models/enlaces/schema').enlaceSchema;

var models = {

	Enlace: mongoose.model('enlaces', enlaceSchema)

};

module.exports = models;