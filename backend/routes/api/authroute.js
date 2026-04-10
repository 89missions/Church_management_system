const express = require('express')
const {authController,loginController} = require('../../controller/authController')
const router = express.Router()

router.post('/login',authController)
router.post('/signup',loginController)

module.exports = router