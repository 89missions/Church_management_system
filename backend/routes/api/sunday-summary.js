const express = require('express');
const { 
    saveSundaySummary, 
    getSundaySummary 
} = require('../../controller/sundaySummaryController');
const router = express.Router();
const verifyRoles = require('../../middlewares/verifyRoles');

router.post('/', verifyRoles('secretary'), saveSundaySummary);
router.get('/', verifyRoles(['secretary','member','leadership']), getSundaySummary);

module.exports = router;