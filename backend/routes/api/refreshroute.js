const express = require('express');
const router = express.Router();
const { refreshAccessToken } = require('../../controller/refreshTokenController');

router.post('/token', refreshAccessToken);

module.exports = router;