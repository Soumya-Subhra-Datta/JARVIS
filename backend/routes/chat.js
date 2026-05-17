const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, chatController.sendMessage);
router.get('/sessions', authenticate, chatController.getSessions);
router.post('/sessions', authenticate, chatController.createSession);
router.get('/sessions/:id', authenticate, chatController.getSession);
router.put('/sessions/:id', authenticate, chatController.updateSession);
router.delete('/sessions/:id', authenticate, chatController.deleteSession);

module.exports = router;
