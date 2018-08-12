var stp = require('./setup');
var mongoose = require('mongoose');
mongoose.connect('mongodb://' + stp.userDataBase + ':' + stp.passDataBase + '@' + stp.urlDataBase + '/' + stp.nombreDataBase);

if (mongoose) { console.log("Conectado con DB: " + stp.nombreDataBase);}
else{
    console.log("Error conectando con DB: " + stp.nombreDataBase);
}

module.exports = mongoose;
