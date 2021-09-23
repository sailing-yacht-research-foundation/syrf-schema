require('dotenv').config();

const { sync } = require('./index');

(async () => {
  await sync();
})();
