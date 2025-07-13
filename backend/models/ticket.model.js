/**
 * Ticket Model
 * Represents a support ticket in the system
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Ticket schema
 */
const TicketSchema = new Schema({
  // Ticket identification
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Customer information
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous tickets
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: false
  },
  
  // Ticket content
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Ticket metadata
  category: {
    type: String,
    enum: ['account', 'billing', 'technical', 'feedback', 'ride', 'driver', 'route', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'pending', 'resolved', 'closed'],
    default: 'open'
  },
  
  // Assignment
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  
  // SLA tracking
  dueDate: {
    type: Date,
    default: null
  },
  
  // Source of the ticket
  source: {
    type: String,
    enum: ['web', 'mobile', 'email', 'phone', 'in-person', 'contact-form'],
    default: 'web'
  },
  
  // Additional data
  metadata: {
    type: Object,
    default: {}
  },
  
  // Tags for categorization
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Create indexes for faster queries
TicketSchema.index({ ticketNumber: 1 }, { unique: true });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ userId: 1 });

// Generate ticket number before saving
TicketSchema.pre('save', async function(next) {
  try {
    // Only generate ticket number for new tickets
    if (this.isNew) {
      // Get current date
      const now = new Date();
      const year = now.getFullYear().toString().substr(-2); // Last two digits of year
      const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
      
      // Get the count of tickets for the current month
      const Ticket = mongoose.model('Ticket');
      const count = await Ticket.countDocuments({
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
      });
      
      // Generate ticket number: TKT-YY-MM-XXXX (e.g., TKT-23-05-0001)
      this.ticketNumber = `TKT-${year}-${month}-${(count + 1).toString().padStart(4, '0')}`;
    }
    
    // Update the updatedAt timestamp
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Create model
const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = Ticket; 