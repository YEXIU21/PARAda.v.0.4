/**
 * Ticket Controller
 * Handles API endpoints for support tickets
 */
const { validationResult } = require('express-validator');
const ticketService = require('../services/ticket.service');
const notificationService = require('../services/notification.service');

/**
 * Create a new ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with created ticket or error
 */
exports.createTicket = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { 
      subject, 
      description, 
      category, 
      priority, 
      customerName, 
      customerEmail, 
      customerPhone,
      initialComment,
      source = 'web'
    } = req.body;
    
    // Set userId if authenticated
    let userId = null;
    if (req.user) {
      userId = req.user._id;
      
      // If authenticated user but no customer name/email provided, use user's data
      if (!customerName) {
        customerName = req.user.username;
      }
      
      if (!customerEmail) {
        customerEmail = req.user.email;
      }
    }
    
    // Create ticket
    const ticket = await ticketService.createTicket({
      subject,
      description,
      category,
      priority,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      initialComment,
      source,
      status: 'open'
    });
    
    // Notify support team
    try {
      await notificationService.createNotification({
        // Notify all support users - in a real system, this would be more targeted
        role: 'support',
        title: 'New Support Ticket',
        message: `New ticket created: ${ticket.ticketNumber} - ${subject}`,
        type: 'info',
        category: 'ticket',
        data: {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber
        }
      });
    } catch (notifError) {
      console.warn('Error creating notification for new ticket:', notifError);
      // Continue even if notification fails
    }
    
    return res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({
      message: 'Error creating ticket',
      error: error.message
    });
  }
};

/**
 * Get ticket by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with ticket data or error
 */
exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Get ticket
    const ticket = await ticketService.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }
    
    // Check if user has access to this ticket
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      // Regular users can only access their own tickets
      if (!ticket.userId || ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'You are not authorized to access this ticket'
        });
      }
    }
    
    // Get comments
    const includeInternal = req.user.role === 'admin' || req.user.role === 'support';
    const comments = await ticketService.getTicketComments(ticketId, includeInternal);
    
    return res.status(200).json({
      ticket,
      comments
    });
  } catch (error) {
    console.error('Error getting ticket:', error);
    return res.status(500).json({
      message: 'Error getting ticket',
      error: error.message
    });
  }
};

/**
 * Get tickets with filtering, sorting, and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with tickets and pagination info
 */
exports.getTickets = async (req, res) => {
  try {
    // Extract query parameters
    const { 
      status, 
      priority, 
      category, 
      assignedTo,
      search,
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'desc'
    } = req.query;
    
    // Build filters
    const filters = {};
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (search) filters.search = search;
    
    // Regular users can only see their own tickets
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      filters.userId = req.user._id;
    }
    
    // Build options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };
    
    // Get tickets
    const result = await ticketService.getTickets(filters, options);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting tickets:', error);
    return res.status(500).json({
      message: 'Error getting tickets',
      error: error.message
    });
  }
};

/**
 * Update ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated ticket or error
 */
exports.updateTicket = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { ticketId } = req.params;
    const { 
      subject, 
      description, 
      category, 
      priority, 
      status,
      dueDate
    } = req.body;
    
    // Get ticket
    const ticket = await ticketService.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }
    
    // Check if user has access to update this ticket
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      // Regular users can only update their own tickets
      if (!ticket.userId || ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'You are not authorized to update this ticket'
        });
      }
      
      // Regular users can only update certain fields
      const allowedFields = ['subject', 'description'];
      const updateKeys = Object.keys(req.body);
      
      for (const key of updateKeys) {
        if (!allowedFields.includes(key)) {
          return res.status(403).json({
            message: `You are not authorized to update the ${key} field`
          });
        }
      }
    }
    
    // Build update data
    const updateData = {};
    
    if (subject) updateData.subject = subject;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    
    // Update ticket
    const updatedTicket = await ticketService.updateTicket(ticketId, updateData, req.user);
    
    return res.status(200).json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({
      message: 'Error updating ticket',
      error: error.message
    });
  }
};

/**
 * Assign ticket to support agent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated ticket or error
 */
exports.assignTicket = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { ticketId } = req.params;
    const { userId } = req.body;
    
    // Only admins and support agents can assign tickets
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({
        message: 'You are not authorized to assign tickets'
      });
    }
    
    // Assign ticket
    const updatedTicket = await ticketService.assignTicket(ticketId, userId, req.user);
    
    // Notify assigned user
    try {
      await notificationService.createNotification({
        userId,
        title: 'Ticket Assigned',
        message: `Ticket ${updatedTicket.ticketNumber} has been assigned to you`,
        type: 'info',
        category: 'ticket',
        data: {
          ticketId: updatedTicket._id,
          ticketNumber: updatedTicket.ticketNumber
        }
      });
    } catch (notifError) {
      console.warn('Error creating notification for ticket assignment:', notifError);
      // Continue even if notification fails
    }
    
    return res.status(200).json({
      message: 'Ticket assigned successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return res.status(500).json({
      message: 'Error assigning ticket',
      error: error.message
    });
  }
};

/**
 * Add comment to ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with created comment or error
 */
exports.addComment = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    
    const { ticketId } = req.params;
    const { content, isInternal = false } = req.body;
    
    // Get ticket
    const ticket = await ticketService.getTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }
    
    // Check if user has access to comment on this ticket
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      // Regular users can only comment on their own tickets
      if (!ticket.userId || ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'You are not authorized to comment on this ticket'
        });
      }
      
      // Regular users cannot add internal comments
      if (isInternal) {
        return res.status(403).json({
          message: 'You are not authorized to add internal comments'
        });
      }
    }
    
    // Determine author type
    let authorType = 'customer';
    if (req.user.role === 'admin' || req.user.role === 'support') {
      authorType = 'support';
    }
    
    // Add comment
    const comment = await ticketService.addComment({
      ticketId,
      authorId: req.user._id,
      authorType,
      authorName: req.user.username,
      content,
      isInternal
    });
    
    // If customer adds a comment and ticket is resolved or closed, reopen it
    if (authorType === 'customer' && (ticket.status === 'resolved' || ticket.status === 'closed')) {
      await ticketService.updateTicket(ticketId, { status: 'open' }, req.user);
      
      // Notify support team
      try {
        await notificationService.createNotification({
          role: 'support',
          title: 'Ticket Reopened',
          message: `Ticket ${ticket.ticketNumber} has been reopened with a new customer comment`,
          type: 'warning',
          category: 'ticket',
          data: {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber
          }
        });
      } catch (notifError) {
        console.warn('Error creating notification for reopened ticket:', notifError);
        // Continue even if notification fails
      }
    }
    
    // If support adds a comment, notify customer
    if (authorType === 'support' && !isInternal && ticket.userId) {
      try {
        await notificationService.createNotification({
          userId: ticket.userId,
          title: 'New Response on Your Ticket',
          message: `A support agent has responded to your ticket ${ticket.ticketNumber}`,
          type: 'info',
          category: 'ticket',
          data: {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber
          }
        });
      } catch (notifError) {
        console.warn('Error creating notification for ticket response:', notifError);
        // Continue even if notification fails
      }
    }
    
    return res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      message: 'Error adding comment',
      error: error.message
    });
  }
};

/**
 * Get ticket statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with ticket statistics
 */
exports.getTicketStatistics = async (req, res) => {
  try {
    // Only admins and support agents can view statistics
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({
        message: 'You are not authorized to view ticket statistics'
      });
    }
    
    // Get statistics
    const statistics = await ticketService.getTicketStatistics();
    
    return res.status(200).json(statistics);
  } catch (error) {
    console.error('Error getting ticket statistics:', error);
    return res.status(500).json({
      message: 'Error getting ticket statistics',
      error: error.message
    });
  }
}; 