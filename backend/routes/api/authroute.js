const express = require('express')
const {authController, changePassword} = require('../../controller/authController')
const router = express.Router()
const verifyJWT = require('../../middlewares/verifyjwt')

router.post('/login',authController)
router.post('/change-password', verifyJWT, changePassword);

module.exports = router