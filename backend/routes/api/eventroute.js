const express = require('express')
const { getEvents, getEventsById, addEvents, editEvent, deleteEvent, getUpcomingEvents } = require('../../controller/eventController')
const router = express.Router()
const verifyRoles = require('../../middlewares/verifyRoles')

router.post('/', verifyRoles('secretary'), addEvents)
router.get('/upcoming', verifyRoles('secretary', 'member', 'leadership'), getUpcomingEvents)
router.get('/:id', verifyRoles('secretary', 'member', 'leadership'), getEventsById)
router.put('/:id', verifyRoles('secretary'), editEvent)
router.delete('/:id', verifyRoles('secretary'), deleteEvent)

module.exports = router