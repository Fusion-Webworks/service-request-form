const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ticket-created', 'ticket-assigned', 'ticket-updated', 'comment-added'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  ticket: {
    type: mongoose.Schema.ObjectId,
    ref: 'Ticket'
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);