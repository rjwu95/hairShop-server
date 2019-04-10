// 유저네임 이메일 패스워드 북마크
const Schema = require('mongoose').Schema;
const shopSchema = require('./shop');

const userSchema = new Schema({
  userName: String,
  email: String,
  password: String,
  bookmark: [shopSchema],
});

module.exports = mongoose.model('user', userSchema);
