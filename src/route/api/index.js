const route = require('express').Router();

route.get('/', (req, res) => {
  res.status(200).send('api Successss');
});

route.use('/shop', require('./shop'));

module.exports = route;
