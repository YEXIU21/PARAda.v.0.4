/**
 * Ticket Comment Model
 * Represents comments and responses on support tickets
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ticket Comment schema
 */
const TicketCommentSchema = new Schema({
  // Related ticket
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  
  // Comment author
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow system-generated comments
  },
  authorType: {
    type: String,
    enum: ['customer', 'support', 'system'],
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  
  // Comment content
  content: {
    type: String,
    required: true
  },
  
  // Is this an internal note (only visible to support staff)
  isInternal: {
    type: Boolean,
    default: false
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // If this comment triggered a status change
  statusChange: {
    oldStatus: String,
    newStatus: String
  },
  
  // Additional metadata
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
TicketCommentSchema.index({ ticketId: 1, createdAt: 1 });
TicketCommentSchema.index({ authorId: 1 });
TicketCommentSchema.index({ isInternal: 1 });

// Update the updatedAt timestamp before saving
TicketCommentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create model
const TicketComment = mongoose.model('TicketComment', TicketCommentSchema);

module.exports = TicketComment; 