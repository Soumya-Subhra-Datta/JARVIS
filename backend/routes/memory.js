const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, memoryController.getMemories);
router.post('/', authenticate, memoryController.addMemory);
router.delete('/:id', authenticate, memoryController.deleteMemory);
router.delete('/', authenticate, memoryController.clearMemories);

module.exports = router;
