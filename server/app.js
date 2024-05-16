/**
 * This module registers all the application logic
 * Use this file to register the routes you implemented.
 */

'use strict';

const express = require('express');
require('express-async-errors')
const cookieParser = require('cookie-parser');

const artworkRoutes = require('./routes/artworks');
const cartRoutes = require('./routes/cart');
const matsRoutes = require('./routes/mats');

const app = express();
app.use(express.json());
app.use(cookieParser());
const expressWs = require('express-ws')(app);

const sharedFramingRoutes = require('./routes/framing/shared')

// Register the modules containing the routes
app.use('/artworks', artworkRoutes);
app.use('/cart', cartRoutes);
app.use('/mats', matsRoutes);
app.use('/framing/shared', sharedFramingRoutes);

app.use((req,res,next) => {
  res.sendStatus(404);
});

module.exports = app;
