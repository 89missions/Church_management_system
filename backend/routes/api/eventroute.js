const express = require('express')
const { getEvents, getEventsById, addEvents, editEvent, deleteEvent, getUpcomingEvents } = require('../../controller/eventController')
const router = express.Router()

router.post('/', addEvents)
router.get('/upcoming', getUpcomingEvents);
router.get('/:id', getEventsById)
router.put('/:id', editEvent)      
router.delete('/:id', deleteEvent) 

module.exports = router