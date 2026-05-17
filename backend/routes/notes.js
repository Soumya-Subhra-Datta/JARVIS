const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, notesController.getNotes);
router.post('/', authenticate, notesController.createNote);
router.put('/:id', authenticate, notesController.updateNote);
router.delete('/:id', authenticate, notesController.deleteNote);

module.exports = router;
