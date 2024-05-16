/**
 * This module contains the routes under /artworks
 */

'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const MET_BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
const highlights = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/highlights.json'))).highlights;

async function getArtwork(id) {
  /** TODO: Cache results and transform return object to match the endpoint description */
    const res = await fetch(MET_BASE_URL + '/objects/' + id);
    if (!res.ok) {
      return null;
    }
    const obj = await res.json();
    if (!obj || !obj.objectID) {
      return null;
    }
    
    return obj;
}

routes.get('/', async (req, res) => {
  if (req.query.q == null) {
    // TODO: return highlights
    res.send([]);
  } else {
    // TODO: search for artworks
    res.sendStatus(501);
  }
});

routes.get('/:id', async (req, res) => {
  const artwork = await getArtwork(parseInt(req.params.id));
  if (artwork == null) {
    res.sendStatus(404);
  } else {
    res.send(artwork);
  }
});

module.exports = routes;
