const express = require('express');
const router = express.Router();

const home = require('../controllers/home');

router.get('/', home.get);
router.post('/', home.post);

module.exports = router;
