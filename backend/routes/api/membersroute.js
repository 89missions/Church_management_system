const express = require('express')
const {getMembers,getMembersWithId,postMembers,updateMembers,deleteMembers} = require('../../controller/membersController')
const router = express.Router()
const verifyRoles = require('../../middlewares/verifyRoles')


router.post('/addmember',verifyRoles('secretary'),postMembers)
router.get('/',verifyRoles('secretary'),getMembers)
router.get('/:id',verifyRoles('secretary'),getMembersWithId)
router.put('/put',verifyRoles('secretary'),updateMembers)
router.delete('/delete/:id',verifyRoles('secretary'),deleteMembers)

console.log('code gets here...')

module.exports = router