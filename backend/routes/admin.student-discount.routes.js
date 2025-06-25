/**
 * Admin Student Discount Routes
 * Routes for managing student discount settings
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentDiscountController = require('../controllers/student-discount.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Middleware to ensure user is authenticated and is an admin
router.use(authMiddleware.verifyToken);
router.use(adminMiddleware);

// GET /api/admin/student-discount
// Get student discount settings
router.get('/', studentDiscountController.getSettings);

// PUT /api/admin/student-discount
// Update student discount settings
router.put('/',
  [
    body('isEnabled').isBoolean().withMessage('isEnabled must be a boolean'),
    body('discountPercent').isFloat({ min: 0, max: 100 }).withMessage('discountPercent must be between 0 and 100')
  ],
  studentDiscountController.updateSettings
);

module.exports = router; 