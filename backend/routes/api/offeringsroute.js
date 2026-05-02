const express = require('express')
const {addOffering,monthlyOfferings,getOfferings,getOfferingsByDateRange,getMemberOfferingwithId} = require('../../controller/offeringsController')
const router = express.Router()
const verifyRoles = require('../../middlewares/verifyRoles')

router.post('/', verifyRoles('secretary'), addOffering)
router.get('/', verifyRoles('secretary'), getOfferings)
router.get('/monthly', verifyRoles('secretary'), monthlyOfferings)
router.get('/today', verifyRoles('secretary'), monthlyOfferings)
router.get('/date-range', verifyRoles('secretary'), getOfferingsByDateRange)
router.get('/:id', verifyRoles(['secretary', 'member']), getMemberOfferingwithId) 

module.exports = router