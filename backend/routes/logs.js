const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, logsController.getLogs);

module.exports = router;
