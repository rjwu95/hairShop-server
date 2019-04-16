const route = require('express').Router();
const { getLogger } = require('../../../config');
const Shop = require('../../models/shop');

const logger = getLogger('Shops');

// getShops
route.get('/getShops/:region', async (req, res) => {
  try {
    let { region } = req.params;
    region = region.replace('+', ' ');
    const result = await Shop.find({
      address: new RegExp(new RegExp(region)),
    });
    return res.status(200).send(result);
  } catch (err) {
    return logger.log(err);
  }
});

module.exports = route;
