/**
 * Ticket Service
 * Handles operations related to support tickets
 */
const Ticket = require('../models/ticket.model');
const TicketComment = require('../models/ticket-comment.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * Create a new ticket
 * @param {Object} ticketData - Ticket data
 * @returns {Promise<Object>} - Created ticket
 */
exports.createTicket = async (ticketData) => {
  try {
    // Create new ticket
    const ticket = new Ticket(ticketData);
    
    // Save ticket
    const savedTicket = await ticket.save();
    
    // Create initial system comment if provided
    if (ticketData.initialComment) {
      await this.addComment({
        ticketId: savedTicket._id,
        authorType: 'system',
        authorName: 'System',
        content: ticketData.initialComment,
        isInternal: false
      });
    }
    
    return savedTicket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

/**
 * Get ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object>} - Ticket data
 */
exports.getTicketById = async (ticketId) => {
  try {
    return await Ticket.findById(ticketId);
  } catch (error) {
    console.error('Error getting ticket:', error);
    throw error;
  }
};

/**
 * Get tickets with filtering, sorting, and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options (sort, pagination)
 * @returns {Promise<Object>} - Tickets and count
 */
exports.getTickets = async (filters = {}, options = {}) => {
  try {
    // Build query
    const query = {};
    
    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.priority) {
      query.priority = filters.priority;
    }
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }
    
    if (filters.userId) {
      query.userId = filters.userId;
    }
    
    if (filters.search) {
      query.$or = [
        { ticketNumber: { $regex: filters.search, $options: 'i' } },
        { subject: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { customerName: { $regex: filters.search, $options: 'i' } },
        { customerEmail: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Set up pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    
    // Set up sorting
    const sort = {};
    if (options.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'desc' ? -1 : 1;
    } else {
      // Default sort by creation date, newest first
      sort.createdAt = -1;
    }
    
    // Execute query
    const tickets = await Ticket.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'username email');
    
    // Get total count for pagination
    const total = await Ticket.countDocuments(query);
    
    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting tickets:', error);
    throw error;
  }
};

/**
 * Update ticket
 * @param {string} ticketId - Ticket ID
 * @param {Object} updateData - Data to update
 * @param {Object} user - User performing the update
 * @returns {Promise<Object>} - Updated ticket
 */
exports.updateTicket = async (ticketId, updateData, user) => {
  try {
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    // Track status change for comment
    let statusChange = null;
    if (updateData.status && updateData.status !== ticket.status) {
      statusChange = {
        oldStatus: ticket.status,
        newStatus: updateData.status
      };
      
      // Set resolvedAt date if status is changing to resolved
      if (updateData.status === 'resolved' && ticket.status !== 'resolved') {
        updateData.resolvedAt = new Date();
      }
      
      // Clear resolvedAt if status is changing from resolved
      if (updateData.status !== 'resolved' && ticket.status === 'resolved') {
        updateData.resolvedAt = null;
      }
    }
    
    // Update ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    );
    
    // Add system comment for status change if needed
    if (statusChange) {
      await this.addComment({
        ticketId,
        authorId: user ? user._id : null,
        authorType: user ? 'support' : 'system',
        authorName: user ? user.username : 'System',
        content: `Ticket status changed from ${statusChange.oldStatus} to ${statusChange.newStatus}`,
        isInternal: true,
        statusChange
      });
    }
    
    return updatedTicket;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

/**
 * Assign ticket to support agent
 * @param {string} ticketId - Ticket ID
 * @param {string} userId - User ID to assign to
 * @param {Object} assignedBy - User performing the assignment
 * @returns {Promise<Object>} - Updated ticket
 */
exports.assignTicket = async (ticketId, userId, assignedBy) => {
  try {
    // Get the ticket
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    // Get the user to assign to
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is a support agent
    if (user.role !== 'support' && user.role !== 'admin') {
      throw new Error('User is not a support agent or admin');
    }
    
    // Update ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      { 
        $set: { 
          assignedTo: userId,
          status: ticket.status === 'open' ? 'in-progress' : ticket.status,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );
    
    // Add comment
    await this.addComment({
      ticketId,
      authorId: assignedBy ? assignedBy._id : null,
      authorType: assignedBy ? 'support' : 'system',
      authorName: assignedBy ? assignedBy.username : 'System',
      content: `Ticket assigned to ${user.username}`,
      isInternal: true
    });
    
    return updatedTicket;
  } catch (error) {
    console.error('Error assigning ticket:', error);
    throw error;
  }
};

/**
 * Add comment to ticket
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} - Created comment
 */
exports.addComment = async (commentData) => {
  try {
    // Create new comment
    const comment = new TicketComment(commentData);
    
    // Save comment
    const savedComment = await comment.save();
    
    // Update ticket's updatedAt timestamp
    await Ticket.findByIdAndUpdate(
      commentData.ticketId,
      { $set: { updatedAt: new Date() } }
    );
    
    return savedComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get comments for a ticket
 * @param {string} ticketId - Ticket ID
 * @param {boolean} includeInternal - Whether to include internal comments
 * @returns {Promise<Array>} - List of comments
 */
exports.getTicketComments = async (ticketId, includeInternal = true) => {
  try {
    // Build query
    const query = { ticketId };
    
    // Exclude internal comments if not requested
    if (!includeInternal) {
      query.isInternal = false;
    }
    
    // Get comments
    const comments = await TicketComment.find(query)
      .sort({ createdAt: 1 })
      .populate('authorId', 'username email');
    
    return comments;
  } catch (error) {
    console.error('Error getting ticket comments:', error);
    throw error;
  }
};

/**
 * Get ticket statistics
 * @returns {Promise<Object>} - Ticket statistics
 */
exports.getTicketStatistics = async () => {
  try {
    // Get counts by status
    const statusCounts = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get counts by priority
    const priorityCounts = await Ticket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get counts by category
    const categoryCounts = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format results
    const formatCounts = (countsArray) => {
      return countsArray.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
    };
    
    return {
      status: formatCounts(statusCounts),
      priority: formatCounts(priorityCounts),
      category: formatCounts(categoryCounts),
      total: await Ticket.countDocuments()
    };
  } catch (error) {
    console.error('Error getting ticket statistics:', error);
    throw error;
  }
}; 