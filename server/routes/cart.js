/**
 * This module contains the routes under /cart
 */

'use strict';

const express = require('express');
const routes = express.Router();

const Session = require('../utils/session');
const Cart = require('../utils/cart');
const { calculatePrice } = require('../utils/price.js');

const sessionCookieName = 'sessionId';

/**
 * Load the cart for a given SID
 * @param sid The session id
 * @return {Cart|null} The cart, or null if the session does not exist
 */
function loadCart(sid) {
  const session = Session.load(sid);
  if (!session) {
    return null;
  }

  if (!session.cart) {
    // Session exists, but no cart set: Create one
    session.cart = new Cart();
  }
  return session.cart;
}

/**
 * Get the items for the cart associated with the user's session
 */
routes.get('/', (req, res) => {
  // Reuse the session if cookie is present, create a new one otherwise
  const sid = req.cookies[sessionCookieName] || Session.create();

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  // Set the session id as a cookie
  res.cookie(sessionCookieName, sid);
  res.send(cart.getItems());
});

/**
 * Add the items for the cart associated with the user's session
 */
routes.post('/', (req, res) => {
  // Reuse the session if cookie is present, create a new one otherwise
  if (! req.cookies[sessionCookieName]) {
    res.sendStatus(403);
    return;
  }

  const sid = req.cookies[sessionCookieName];

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  if (! cart.itemIsValid(req.body)) {
    res.status(400).send({});
    return;
  }

  cart.addItem(req.body);

  // Set the session id as a cookie
  res.cookie(sessionCookieName, sid);
  res.sendStatus(201);
});

/**
 * Get the items for the cart associated with the user's session
 */
routes.delete('/', (req, res) => {
  if (! req.cookies[sessionCookieName]) {
    res.sendStatus(403);
    return;
  }

  // Reuse the session if cookie is present, create a new one otherwise
  const sid = req.cookies[sessionCookieName] || Session.create();

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  cart.clear();

  // Set the session id as a cookie
  res.cookie(sessionCookieName, sid);
  res.sendStatus(204);
});

/**
 * Get the items for the cart associated with the user's session
 */
routes.delete('/:id', (req, res) => {
  if (! req.cookies[sessionCookieName]) {
    res.sendStatus(403);
    return;
  }

  // Reuse the session if cookie is present, create a new one otherwise
  const sid = req.cookies[sessionCookieName];

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  if (! cart.items.has(Number(req.params.id))) {
    res.sendStatus(404);
    return;
  }

  cart.items.delete(Number(req.params.id))

  // Set the session id as a cookie
  res.cookie(sessionCookieName, sid);
  res.sendStatus(204);
});

/**
 * Get the items for the cart associated with the user's session
 */
routes.get('/:id', (req, res) => {
  if (! req.cookies[sessionCookieName]) {
    res.sendStatus(403);
    return;
  }

  // Reuse the session if cookie is present, create a new one otherwise
  const sid = req.cookies[sessionCookieName];

  // Try to load the cart for the session id
  const cart = loadCart(sid);
  if (!cart) {
    res.sendStatus(403);
    return;
  }

  if (! cart.items.has(Number(req.params.id))) {
    res.sendStatus(404);
    return;
  }

  // Set the session id as a cookie
  res.cookie(sessionCookieName, sid);
  res.status(200).send(cart.items.get(Number(req.params.id)));
});

/** TODO: finish implementation */

module.exports = routes;
