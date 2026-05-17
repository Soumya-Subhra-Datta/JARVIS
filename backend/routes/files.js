const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', authenticate, upload.single('file'), filesController.uploadFile);
router.get('/', authenticate, filesController.getFiles);
router.get('/:id', authenticate, filesController.getFile);
router.delete('/:id', authenticate, filesController.deleteFile);
router.post('/:id/ask', authenticate, filesController.askFile);

module.exports = router;
