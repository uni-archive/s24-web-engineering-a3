/**
 * This module contains the routes under /mats
 */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const shippinh = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/shipping.json')));

const routes = express.Router();

routes.get('/', (req, res) => {
  res.send(shippinh);
});

module.exports = routes;
