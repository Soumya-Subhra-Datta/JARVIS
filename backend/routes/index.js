const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/chat', require('./chat'));
router.use('/memory', require('./memory'));
router.use('/tasks', require('./tasks'));
router.use('/notes', require('./notes'));
router.use('/files', require('./files'));
router.use('/csv', require('./csv'));
router.use('/settings', require('./settings'));
router.use('/logs', require('./logs'));

module.exports = router;
