const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  hasEmoji: {
    type: Boolean,
    default: false
  },
  // Para armazenar emojis específicos usados na mensagem, se necessário
  emojis: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('Message', messageSchema);