var mongoose = require('../../config/mongoose');
var Schema = mongoose.Schema;

var schemas = {

			    productosSchema: new Schema({
								        nombre: {type: String},
								        alias: {type: String},
								        imagen: {type: String,default: ""},
								        intro: {type: String,default: ""},
								        descripcion: {type: String,default: ""},
									    creado: { type: Date,default: Date.now },
									    precio: { type: Number ,default:0 },
									    stock: { type: Number ,default:0 },
									    destacado: { type: Number ,default:0 },
									    video: { type: String ,default:"" },
									    categoria: { type: String ,default:"" },
								        estado: {type: Boolean,default: true}
			        					})

			  };

module.exports = schemas;