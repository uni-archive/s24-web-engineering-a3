/**
 * This module contains the routes under /cart/checkout
 */

'use strict';

const express = require('express');
const routes = express.Router();

const fetch = require('node-fetch');
const { writeOrder } = require('../utils/order');
const fs = require('fs');
const path = require('path');

const sessionCookieName = 'sessionId';
const BLING_BASE_URL = 'https://web-engineering.big.tuwien.ac.at/s24/bling'

async function createPaymentIntent(amount) {
    console.log(JSON.stringify({
        amount: amount,
        currency: 'eur',
        "webhook": process.env.ARTMART_BASE_URL,
    }));
    const res = await fetch(BLING_BASE_URL + '/payment_intents', {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + btoa(process.env.BLING_API_KEY + ":"),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            amount: amount,
            currency: 'eur',
            "webhook": process.env.ARTMART_BASE_URL,
        })
    })
    if (!res.ok) {
        return null;
    }
    return await res.json();
}

const destinations = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/shipping.json')));
const shippingCosts = {};
for (const dest of destinations.countries) {
  shippingCosts[dest.isoCode] = dest;
}

const Session = require('../utils/session');
const Cart = require("../utils/cart");
const {setData, getByPaymentSessionId} = require("../utils/session");
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
 * Add the items for the cart associated with the user's session
 */
routes.post('/', async (req, res) => {
    // Reuse the session if cookie is present, create a new one otherwise
    const sid = req.cookies[sessionCookieName];

    // Try to load the cart for the session id
    const cart = loadCart(sid);
    if (!cart) {
        res.sendStatus(403);
        return;
    }

    if (cart.getItems().length === 0) {
        res.sendStatus(400);
        return;
    }

    // Set the session id as a cookie


    res.cookie(sessionCookieName, sid);
    const paymentIntent = await createPaymentIntent(cart.getItems().reduce((acc, item) => acc + item.price, 0));
    setData(sid, {
        body: req.body,
        paymentIntent,
    });
    res.status(200).send({
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
    });
});
/**
 * Add the items for the cart associated with the user's session
 */
routes.post('/payment-update', async (req, res) => {
    // create a new order file in orders dir
    const sesId = getByPaymentSessionId(req.body.payment_intent.id);
    const data = Session.load(sesId);
    const order = {
        order_date: new Date().toISOString(),
        email: data.body.email,
        shipping_address: data.body.shipping_address,
        card: req.body.payment_intent.card,
        amount: req.body.payment_intent.amount,
        currency: req.body.payment_intent.currency,
        cart: data.cart.getItems().map(i => ({
            artworkId: i.artworkId,
            printSize: i.printSize,
            frameStyle: i.frameStyle,
            frameWidth: i.frameWidth,
            matWidth: i.matWidth,
            matColor: i.matColor,
            price: i.price
        })),

    };

    if (req.body.payment_intent.status === 'succeeded') {
        writeOrder(order);
        data.cart.clear();
    }

    res.sendStatus(204);
});


module.exports = routes;
