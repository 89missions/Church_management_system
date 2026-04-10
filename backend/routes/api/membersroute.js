const express = require('express')
const {getMembers,getMembersWithId,postMembers,updateMembers,deleteMembers} = require('../../controller/membersController')
const router = express.Router()

router.post('/post',postMembers)
router.get('/get',getMembers)
router.get('/get/:id',getMembersWithId)
router.put('/put',updateMembers)
router.delete('/delete',deleteMembers)

module.exports = router