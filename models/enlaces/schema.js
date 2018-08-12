var mongoose = require('../../config/mongoose'),
      Schema = mongoose.Schema;

var schemas = {

    enlaceSchema: new Schema({
        nombre: {type: String},
        componente: {type: String},
        estado: {type: Number},
        privilegio: {type: Number},
        alias: {type: String},
        id_cat: {type: String}
    })

};

module.exports = schemas;