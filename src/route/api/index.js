const route = require('express').Router();

route.get('/', (req, res) => {
  res.status(200).send('api Successss');
});

module.exports = route;
