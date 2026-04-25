const express = require('express')
const {addSummary,getLatestSundaySummary} = require('../../controller/sundaySummaryController')
const router = express.Router()
const verifyRoles = require('../../middlewares/verifyRoles')

router.post('/',verifyRoles('secretary'),addSummary)
router.get('/latest',verifyRoles(['secretary','member','leadership']),getLatestSundaySummary)

module.exports = router