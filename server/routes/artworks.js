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

const artworkCache = {};
const searchCache = {};

async function getArtwork(id) {
    if (artworkCache[id])
      return artworkCache[id];

    const res = await fetch(MET_BASE_URL + '/objects/' + id);
    if (!res.ok) {
      return null;
    }
    const obj = await res.json();
    if (!obj || !obj.objectID) {
      return null;
    }

    const artwork = {
      artworkId: obj.objectID,
      title: obj.title,
      artist: obj.artistDisplayName,
      date: obj.objectDate,
      image: obj.primaryImageSmall
    };

    artworkCache[id] = artwork;

    return artwork;
}

async function search(q) {
    if (searchCache[q])
      return searchCache[q];

    const res = await fetch(MET_BASE_URL + '/search?hasImages=true&q=' + q);
    if (!res.ok) {
      return null;
    }
    const obj = await res.json();
    obj.url = MET_BASE_URL + '/search?q=' + q;
    if (!obj || !obj.objectIDs) {
      return [];
    }

    searchCache[q] = obj.objectIDs;

    return obj.objectIDs;
}

routes.get('/', async (req, res) => {
  if (req.query.q == null) {
    res.send(await Promise.all(highlights.map(id => getArtwork(id))));
  } else {
    res.send(await Promise.all((await search(req.query.q)).map(id => getArtwork(id))));
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
