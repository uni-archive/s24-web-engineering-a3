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

const BLING_BASE_URL = 'https://web-engineering.big.tuwien.ac.at/s24/bling'

async function createPaymentIntent(amount) {
    const res = await fetch(BLING_BASE_URL + '/payment_intents', {
        method: 'POST',
        headers: {
            /* TODO: send correct headers */
        },
        body: '' /* TODO: send correct body */
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

/** TODO: add checkout routes  */


module.exports = routes;
