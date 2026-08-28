// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rota de login
router.post('/login', authController.login);

module.exports = router;
