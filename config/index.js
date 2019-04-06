require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const log4js = require('log4js');
log4js.configure(require('./log4js'));

const { getLogger } = log4js;

const config = {
  getLogger
};

module.exports = config;