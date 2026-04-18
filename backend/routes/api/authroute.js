const express = require('express')
const {authController, changePassword} = require('../../controller/authController')
const router = express.Router()

router.post('/login',authController)
router.post('/change-password',changePassword)

module.exports = router