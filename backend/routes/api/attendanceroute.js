const express = require('express')
const {getTodayAttendance, markAttendance} = require('../../controller/attendanceController')
const verifyRoles = require('../../middlewares/verifyRoles')
const router = express.Router()

router.post('/mark', verifyRoles('usher'), markAttendance);
router.get('/today', verifyRoles('usher'), getTodayAttendance);

module.exports = router