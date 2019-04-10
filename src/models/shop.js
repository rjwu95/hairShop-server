const mongoose = require('mongoose');
var menuSchema = require('./menus').menuSchema;
var reviewSchema = require('./reviews').reviewSchema;

const Schema = mongoose.Schema;

const shopSchema = new Schema({
  name: String,
  address: String,
  category: String,
  rating: Number,
  menu: [new shopSchema(menuSchema)],
  review: [new Schema(reviewSchema)],
  image: [String],
});
module.exports = mongoose.model('shop', shopSchema);
