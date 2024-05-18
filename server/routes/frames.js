/**
 * This module contains the routes under /mats
 */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const frames = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/frames.json')));
const framesMapped = frames.map(x => ({ style: x.id, label: x.label, slice: x.border.slice, cost: x.cost }));

const routes = express.Router();

routes.get('/', (req, res) => {
  res.send(framesMapped);
});
routes.get('/', (req, res) => {
  res.send(framesMapped);
});

module.exports = routes;
