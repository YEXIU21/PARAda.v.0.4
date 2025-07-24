const express = require('express');
const router = express.Router();
const installationController = require('../controllers/installation.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.get('/count', installationController.getInstallationCount);
router.post('/register', installationController.registerInstallation);

// Admin-only routes
router.get('/stats', verifyToken, installationController.getInstallationStats);

module.exports = router; 