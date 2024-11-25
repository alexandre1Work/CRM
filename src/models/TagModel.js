const mongoose = require('mongoose');
const { Schema } = mongoose;

const TagSchema = new Schema({
    nome_tag: { type: String, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
});

const Tag = mongoose.model('Tag', TagSchema);
 module.exports = Tag