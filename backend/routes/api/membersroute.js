const express = require('express')
const {getMembers, getMembersWithId, postMembers, updateMembers, deleteMembers, searchMembers, getMembersCount} = require('../../controller/membersController')
const router = express.Router()
const verifyRoles = require('../../middlewares/verifyRoles')

router.post('/addmember', verifyRoles('secretary'), postMembers)
router.get('/', verifyRoles('secretary'), getMembers)
router.get('/search', verifyRoles('usher', 'secretary'), searchMembers)  
router.get('/count', verifyRoles('usher', 'secretary'), getMembersCount)
router.get('/:id', verifyRoles(['secretary', 'member']), getMembersWithId)
router.put('/:id', verifyRoles('secretary'), updateMembers)
router.delete('/delete/:id', verifyRoles('secretary'), deleteMembers)

module.exports = router