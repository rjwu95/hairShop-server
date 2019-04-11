const Schema = require('mongoose').Schema;
const userSchema = require('./user');
const reviewSchema = new Schema({
  writer: userSchema,
  image: String,
  description: String,
  Date: { type: Date, default: Date.now },
  rating: Number,
});

module.exports = mongoose.model('Review', reviewSchema);
