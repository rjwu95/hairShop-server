const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const shopSchema = new Schema({
  name: String,
  address: String,
  category: String,
  rating: Number,
  menu: [{ name: String, price: Number }],
  review: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  image: [String],
});
module.exports = mongoose.model('Shop', shopSchema);
