const express = require('express');
const router = express.Router();
const { getVapidPublicKey } = require('../../controller/pushController');

router.get('/vapid-public-key', getVapidPublicKey);

module.exports = router;