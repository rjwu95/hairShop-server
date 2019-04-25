const route = require('express').Router();
const { getLogger } = require('../../../config');
const Shop = require('../../models/shop');

const logger = getLogger('Shops');

const LAT_DISTANCE = 0.0018; // 약 200m
const LNG_DISTANCE = 0.00227; // 약 200m

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

route.get('/currentLocation', async (req, res) => {
  try {
    let { latitude, longitude } = req.headers;
    [latitude, longitude] = [Number(latitude), Number(longitude)];
    const sLat = latitude - LAT_DISTANCE;
    const sLng = longitude - LNG_DISTANCE;
    const eLat = latitude + LAT_DISTANCE;
    const eLng = longitude + LNG_DISTANCE;

    const shopList = await Shop.find({
      'location.lat': { $gte: sLat, $lte: eLat },
      'location.lng': { $gte: sLng, $lte: eLng },
    });
    return res.status(200).send(shopList);
  } catch (err) {
    return logger.log(err);
  }
});

module.exports = route;
