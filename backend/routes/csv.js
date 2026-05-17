const express = require('express');
const router = express.Router();
const csvController = require('../controllers/csvController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', authenticate, upload.single('file'), csvController.uploadCsv);
router.get('/:id/summary', authenticate, csvController.getSummary);
router.post('/:id/ask', authenticate, csvController.askCsv);
router.get('/', authenticate, csvController.getDatasets);
router.delete('/:id', authenticate, csvController.deleteDataset);

module.exports = router;
