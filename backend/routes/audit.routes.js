/**
 * Audit Routes
 * 
 * API routes for audit logs
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.verifyToken);

// Only allow admin and support roles to access audit logs
router.use(roleMiddleware.restrictTo(['admin', 'support']));

// Get all audit logs with filtering and pagination
// GET /api/audit/logs
router.get('/logs', roleMiddleware.restrictTo(['admin']), auditController.getAuditLogs);

// Get audit logs for a specific user
// GET /api/audit/user/:userId
router.get('/user/:userId', auditController.getUserAuditLogs);

// Get audit log statistics
// GET /api/audit/stats
router.get('/stats', roleMiddleware.restrictTo(['admin']), auditController.getAuditStats);

// Get a single audit log by ID
// GET /api/audit/logs/:id
router.get('/logs/:id', auditController.getAuditLogById);

// Delete audit logs older than a specified date
// DELETE /api/audit/logs
router.delete('/logs', roleMiddleware.restrictTo(['admin']), auditController.deleteOldAuditLogs);

module.exports = router; 