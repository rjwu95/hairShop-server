const Schema = require('mongoose').Schema;
const userSchema = require('./user');
exports.reviewSchema = new Schema({
  writer: userSchema,
  image: String,
  description: String,
  Date: { type: Date, default: Date.now },
  rating: Number,
});
