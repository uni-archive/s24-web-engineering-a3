/**
 * This module is used as the Node.js entry point for starting the server
 * Do not implement anything here, it will not be visible to the tests!
 */

'use strict';

const app = require('./app');
const port = process.argv.length >= 3 ? +process.argv[2] : 3000;
process.env.BLING_API_KEY = ('ak_s24a3m12231214');

app.listen(port, () =>
    console.log(`Server is listening on http://localhost:${port}`)
);
