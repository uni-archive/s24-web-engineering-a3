/**
 * This module contains the routes under /websocket
 */

'use strict';

const express = require('express');

const routes = express.Router();

const sessionTimeout =  +process.env.WS_TIMEOUT || 120_000;

routes.ws("/create", (ws) => {
    // TODO: Implement Websocket handling
});

// TODO: Add other websocket Endpoints


module.exports = routes;