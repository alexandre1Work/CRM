const mongoose = require('mongoose');
const { Schema } = mongoose;

const MensagemSchema = new Schema({
    titulo: { type: String, required: true, maxlength: 50 },
    corpo: { type: String, required: true, maxlength: 500 },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Mensagem = mongoose.model('Mensagem', MensagemSchema)
 module.exports = Mensagem