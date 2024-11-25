const mongoose = require('mongoose');
const { Schema } = mongoose;

const TagSchema = new Schema({
    nome_tag: { type: String, required: true }
});

const Tag = mongoose.model('Tag', TagSchema);
 module.exports = Tag