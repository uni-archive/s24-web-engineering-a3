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

/** TODO: finish implementation */

module.exports = routes;
