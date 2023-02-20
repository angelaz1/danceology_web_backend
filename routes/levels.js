const express = require('express');
const router = express.Router();

const levels = require('../controllers/levels');

router.get('/', levels.get);
router.get('/:id', levels.getLevel);
router.post('/:id/edit', levels.editLevel);
router.post('/:id/delete', levels.deleteLevel);
// router.post('/', home.post);

module.exports = router;
