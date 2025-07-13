/**
 * Ticket Routes
 * Defines API endpoints for support tickets
 */
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const ticketController = require('../controllers/ticket.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @route   POST /api/tickets
 * @desc    Create a new ticket
 * @access  Public (for anonymous submissions) / Private (for authenticated users)
 */
router.post(
  '/',
  [
    check('subject', 'Subject is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('customerName', 'Customer name is required').not().isEmpty(),
    check('customerEmail', 'Please include a valid email').isEmail()
  ],
  ticketController.createTicket
);

/**
 * @route   GET /api/tickets
 * @desc    Get tickets with filtering, sorting, and pagination
 * @access  Private
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  ticketController.getTickets
);

/**
 * @route   GET /api/tickets/:ticketId
 * @desc    Get ticket by ID
 * @access  Private
 */
router.get(
  '/:ticketId',
  authMiddleware.verifyToken,
  ticketController.getTicketById
);

/**
 * @route   PUT /api/tickets/:ticketId
 * @desc    Update ticket
 * @access  Private
 */
router.put(
  '/:ticketId',
  [
    authMiddleware.verifyToken,
    check('subject', 'Subject is required if provided').optional().not().isEmpty(),
    check('description', 'Description is required if provided').optional().not().isEmpty(),
    check('status', 'Invalid status').optional().isIn(['open', 'in-progress', 'pending', 'resolved', 'closed']),
    check('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    check('category', 'Invalid category').optional().isIn(['account', 'billing', 'technical', 'feedback', 'ride', 'driver', 'route', 'other'])
  ],
  ticketController.updateTicket
);

/**
 * @route   POST /api/tickets/:ticketId/assign
 * @desc    Assign ticket to support agent
 * @access  Private (Admin and Support only)
 */
router.post(
  '/:ticketId/assign',
  [
    authMiddleware.verifyToken,
    check('userId', 'User ID is required').not().isEmpty()
  ],
  ticketController.assignTicket
);

/**
 * @route   POST /api/tickets/:ticketId/comments
 * @desc    Add comment to ticket
 * @access  Private
 */
router.post(
  '/:ticketId/comments',
  [
    authMiddleware.verifyToken,
    check('content', 'Comment content is required').not().isEmpty()
  ],
  ticketController.addComment
);

/**
 * @route   GET /api/tickets/statistics
 * @desc    Get ticket statistics
 * @access  Private (Admin and Support only)
 */
router.get(
  '/statistics',
  authMiddleware.verifyToken,
  ticketController.getTicketStatistics
);

module.exports = router; 