const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const logger = require('./config').getLogger('Server');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

const config = require('./config/mongoose.json');

app.listen(port, () => {
  logger.info(`The server is listening on port ${port}`);
});

app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', require('./src/route/api'));
// app.use('/oauth', require('./src/route/oauth'));

app.get('/', (req, res) => {
  res.status(200).send('Succccessss');
});

mongoose.connect(config.mongodbHost, {
  useNewUrlParser: true,
});
// var MyModel = mongoose.model('Test', new Schema({ name: String }));
// MyModel.findOne((err, result) => console.log(result));
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', () => {
  logger.info('✓ DB connection success.');
});
