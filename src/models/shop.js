const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const shopSchema = new Schema({
  name: String,
  address: [String],
  category: String,
  rating: Number,
  menu: Object,
  review: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
  image: [String],
  contact: String,
  homepage: String,
  openingHours: [String],
  location: Object,
  tags: [String],
});
module.exports = mongoose.model('Shop', shopSchema);
