const express = require('express')
const {getTodayAttendance, markAttendance,getMemberAttendance,getMemberStreak} = require('../../controller/attendanceController')
const verifyRoles = require('../../middlewares/verifyRoles')
const router = express.Router()

router.post('/mark', verifyRoles('usher'), markAttendance);
router.get('/today', verifyRoles('usher'), getTodayAttendance);
router.get('/member/:memberId', verifyRoles('member'), getMemberAttendance);
router.get('/streak/:memberId', verifyRoles('member'), getMemberStreak);

module.exports = router