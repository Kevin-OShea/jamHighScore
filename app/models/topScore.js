const mongoose = require('mongoose')

const topScore = new mongoose.Schema({
  score: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('TopScore', topScore)
