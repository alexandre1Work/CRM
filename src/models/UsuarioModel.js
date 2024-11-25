const mongoose = require('mongoose')

const UsuarioSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
  });

const Usuario = mongoose.model('Usuario', UsuarioSchema);
module.exports = Usuario